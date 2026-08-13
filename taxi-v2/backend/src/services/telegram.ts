import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  getActiveChannels,
  getChannels,
  addChannel,
  updateChannel,
  getChannelByChannelId,
  addPost,
  addDriverPost,
  findPostByFingerprint,
  findDriverPostByFingerprint,
  findPostByPhone,
} from '../services/storage';
import {
  normalizeText,
  extractPhone,
  extractUsername,
  extractPassengerCount,
  generateFingerprint,
} from '../utils/text';
import { classifyMessage } from '../services/classifier';
import { socketService } from './socket';
import { Post, Channel } from '../types';

type NewPostHandler = (post: Post) => void;

interface IncomingMeta {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  messageId: number;
  messageDate: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
}

class TelegramCollector {
  private client: TelegramClient | null = null; // user session (channel monitoring)
  private botClient: TelegramClient | null = null; // bot (forward + admin channels)
  private connected = false;
  private onNewPost: NewPostHandler | null = null;
  private titleCache: Record<string, string> = {};

  onPost(handler: NewPostHandler): void {
    this.onNewPost = handler;
  }

  pushToHandlers(post: Post): void {
    if (this.onNewPost) this.onNewPost(post);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (config.telegram.session && config.telegram.apiId) tasks.push(this.connectUser());
    if (config.telegram.botToken) tasks.push(this.connectBot());
    if (tasks.length === 0) {
      logger.warn('No Telegram credentials (need TELEGRAM_SESSION or BOT_TOKEN).');
      return;
    }
    await Promise.allSettled(tasks);
    if (this.connected) {
      this.joinRegisteredChannels();
      this.ensureSeedChannels().catch((e) => logger.error('ensureSeedChannels', e));
    }
    logger.info(`Telegram connected: user=${!!this.client}, bot=${!!this.botClient}`);
  }

  // ---- User session (monitors channels the account is in) ----
  private connectUser(): Promise<void> {
    return new Promise<void>((resolve) => {
      const session = new StringSession(config.telegram.session);
      const client = new TelegramClient(session, config.telegram.apiId, config.telegram.apiHash, {
        connectionRetries: 5,
      });
      client
        .start({} as any)
        .then(async () => {
          this.client = client;
          this.connected = true;
          logger.info('Telegram user session connected');
          this.setupUserHandler();
          this.joinRegisteredChannels();
          this.backfillAll(7).catch((e) => logger.error('backfillAll', e));
          resolve();
        })
        .catch((e) => {
          logger.error('Telegram user session failed:', e);
          resolve();
        });
    });
  }

  // ---- Bot (forwarded posts + channels where it is admin) ----
  private connectBot(): Promise<void> {
    this.connectBotAttempt(0);
    return Promise.resolve();
  }

  private connectBotAttempt(retries = 0): void {
    const session = new StringSession('');
    const client = new TelegramClient(session, config.telegram.apiId, config.telegram.apiHash, {
      connectionRetries: 5,
      timeout: 30,
      deviceModel: 'Taxi Collector Bot',
    });
    client
      .start({ botAuthToken: config.telegram.botToken } as any)
        .then(async () => {
          const me: any = await client.getMe();
          this.botClient = client;
          this.connected = true;
          logger.info(`Telegram bot connected as @${me.username}`);
          this.setupBotHandler();
          this.setBotMenuButton();
          this.joinRegisteredChannels();
          this.backfillAll(7).catch((e) => logger.error('backfillAll', e));
        })
      .catch((error: any) => {
        const isFlood = error?.errorMessage === 'FLOOD' || error?.code === 420;
        const wait = typeof error?.seconds === 'number' ? error.seconds : 60;
        if (isFlood && retries < 6) {
          const delay = Math.min(wait, 600) * 1000 + 3000;
          logger.warn(`Bot flood-wait (${wait}s). Auto-retry in ${Math.round(delay / 1000)}s...`);
          setTimeout(() => this.connectBotAttempt(retries + 1), delay);
          return;
        }
        logger.error('Telegram bot connection failed:', error);
      });
  }

  // Set the bot's menu button (Web App) so the Mini App opens from the bot.
  private async setBotMenuButton(): Promise<void> {
    const client = this.botClient;
    const url = config.telegram.webAppUrl;
    if (!client || !url) return;
    try {
      await client.invoke(
        new Api.bots.SetBotMenuButton({
          userId: 'me',
          button: new Api.BotMenuButton({ text: 'Ochish', url }),
        })
      );
      logger.info(`Bot menu button set -> ${url}`);
    } catch (e) {
      logger.warn('Failed to set bot menu button:', (e as any)?.errorMessage || e);
    }
  }

  // Ensure channels listed in SEED_CHANNELS env are registered (survives restarts
  // without persistent disk; posts are re-backfilled on connect).
  private async ensureSeedChannels(): Promise<void> {
    const seeds = config.server.seedChannels || [];
    if (seeds.length === 0 || !this.client) return;
    for (const username of seeds) {
      if (!username) continue;
      if (getChannels().find((c) => c.username === username)) continue;
      try {
        const resolved = await this.resolveChannel(username);
        const channelId = resolved?.channelId || username;
        const channelTitle = resolved?.title || username;
        const channel: Channel = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          channelId,
          username,
          title: channelTitle,
          url: `https://t.me/${username}`,
          status: 'active',
          lastProcessedMessageId: 0,
          lastEventTime: null,
          totalCollectedPosts: 0,
          totalPassengerPosts: 0,
          totalDriverPosts: 0,
          addedAt: new Date().toISOString(),
        };
        addChannel(channel);
        this.joinChannel(username).catch(() => {});
        this.backfillChannel(username).catch(() => {});
        logger.info(`Seed channel ensured: ${username}`);
      } catch (e) {
        logger.error('Seed channel failed', username, e);
      }
    }
  }

  private joinRegisteredChannels(): void {
    if (!this.client) return;
    for (const ch of getActiveChannels()) {
      this.joinChannel(ch.username).catch(() => {});
    }
  }

  async joinChannel(username: string): Promise<{ channelId: string; title: string; url: string } | null> {
    const client = this.client;
    if (!client) return null;
    try {
      const entity: any = await client.getEntity(username);
      await client.invoke(new Api.channels.JoinChannel({ channel: username }));
      return {
        channelId: entity.id?.toString?.() || entity.channelId?.toString() || username,
        title: entity.title || username,
        url: `https://t.me/${String(username).replace('@', '')}`,
      };
    } catch (e) {
      // Already a member or cannot join; still try to resolve entity
      try {
        const entity: any = await client.getEntity(username);
        return {
          channelId: entity.id?.toString?.() || entity.channelId?.toString() || username,
          title: entity.title || username,
          url: `https://t.me/${String(username).replace('@', '')}`,
        };
      } catch {
        return null;
      }
    }
  }

  // Resolve a channel's numeric id (works with bot OR user client) for storage.
  async resolveChannel(username: string): Promise<{ channelId: string; title: string; url: string } | null> {
    const client = this.client || this.botClient;
    if (!client) return null;
    try {
      const entity: any = await client.getEntity(username);
      return {
        channelId: entity.id?.toString?.() || entity.channelId?.toString() || username,
        title: entity.title || username,
        url: `https://t.me/${String(username).replace('@', '')}`,
      };
    } catch {
      return null;
    }
  }

  // ---- User handler ----
  private setupUserHandler(): void {
    if (!this.client) return;
    this.client.addEventHandler(async (update: any) => {
      try {
        let message: any = null;
        let channelId = '';
        let channelTitle = '';
        if (update instanceof Api.UpdateNewChannelMessage) {
          message = update.message as any;
          channelId = message.peerId?.channelId?.toString() || '';
        } else if (update instanceof Api.UpdateNewMessage) {
          message = update.message as any;
          if (!message || message.out) return;
          channelId = message.peerId?.channelId?.toString() || '';
        } else {
          return;
        }
        if (!message || !channelId) return;
        // Faqat allowlist'dagi kanallar
        const ch = getChannelByChannelId(channelId);
        if (!ch) return;
        channelTitle = ch.title;
        const text = typeof message.message === 'string' ? message.message : '';
        if (!text && !message.media) return;
        await this.processIncoming(text, message, {
          channelId,
          channelTitle,
          channelUrl: ch.url || '',
          messageId: message.id,
          messageDate: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
        }, ch);
      } catch (e) {
        logger.error('User handler error:', e);
      }
    });
  }

  // ---- Bot handler ----
  private setupBotHandler(): void {
    if (!this.botClient) return;
    this.botClient.addEventHandler(async (update: any) => {
      try {
        let message: any = null;
        let channelId = 'bot';
        let channelTitle = 'Bot (forwarded)';
        let channelUrl = '';
        if (update instanceof Api.UpdateNewMessage) {
          message = update.message as any;
          if (!message || message.out) return;
          const fwd = message.fwd_from;
          channelId = fwd?.fromId?.channelId?.toString() || 'bot';
          channelTitle = (fwd?.fromName as string) || 'Bot (forwarded)';
          channelUrl = fwd?.fromId?.channelId ? `https://t.me/c/${fwd.fromId.channelId}` : '';
        } else if (update instanceof Api.UpdateNewChannelMessage) {
          message = update.message as any;
          channelId = message.peerId?.channelId?.toString() || '';
          // Faqat allowlist'dagi kanallar
          const ch = getChannelByChannelId(channelId);
          if (!ch) return;
          channelTitle = ch.title;
          channelUrl = ch.url || '';
        } else {
          return;
        }
        const text = typeof message.message === 'string' ? message.message : '';
        if (!text && !message.media) return;
        await this.processIncoming(text, message, {
          channelId,
          channelTitle,
          channelUrl,
          messageId: message.id,
          messageDate: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
        }, getChannelByChannelId(channelId) || null);
      } catch (e) {
        logger.error('Bot handler error:', e);
      }
    });
  }

  // ---- Shared processing ----
  private async processIncoming(
    text: string,
    message: any,
    meta: IncomingMeta,
    channel: Channel | null,
    broadcast = true,
    downloadMedia = true
  ): Promise<void> {
    const result = classifyMessage(text);

    // FILTER: passenger posts go to the main feed. Driver posts are kept in a
    // small sample buffer (so the app isn't empty when passengers are rare).
    const postType = result.type.toLowerCase() as 'passenger' | 'driver' | 'unknown';

    if (postType === 'driver') {
      const fingerprint = generateFingerprint(text);
      if (findDriverPostByFingerprint(fingerprint)) return;
      const driverPost: Post = {
        id: `drv_${meta.channelId}_${meta.messageId}`,
        messageId: meta.messageId,
        channelId: meta.channelId,
        channelTitle: meta.channelTitle,
        channelUrl: meta.channelUrl,
        originalText: text,
        normalizedText: normalizeText(text),
        route: result.route,
        passengerCount: null,
        phone: result.phone ?? extractPhone(text),
        username: extractUsername(text),
        classification: 'driver',
        confidence: result.confidence,
        duplicateFingerprint: fingerprint,
        isDuplicate: false,
        messageDate: meta.messageDate,
        collectedAt: new Date().toISOString(),
        mediaType: null,
        mediaUrl: null,
      };
      addDriverPost(driverPost);
      if (broadcast) socketService.broadcastNewDriverPost(driverPost);
      return;
    }

    if (postType !== 'passenger') return;

    const fingerprint = generateFingerprint(text);
    const phone = extractPhone(text);

    // DUPLICATE: keep only one across channels (task #3)
    const isDup = !!findPostByFingerprint(fingerprint) || !!(phone && findPostByPhone(phone));
    if (isDup) return;

    const mediaInfo = downloadMedia ? await this.extractMediaInfo(message) : null;

    let finalText = text;
    if (!finalText && mediaInfo?.type) {
      finalText = mediaInfo.type === 'photo' ? "📷 Rasm e'loni" : '📎 Fayl e\'loni';
    }
    if (!finalText) return;

    const post: Post = {
      id: `${meta.channelId}_${meta.messageId}`,
      messageId: meta.messageId,
      channelId: meta.channelId,
      channelTitle: meta.channelTitle,
      channelUrl: meta.channelUrl,
      originalText: finalText,
      normalizedText: normalizeText(finalText),
      route: result.route,
      passengerCount: extractPassengerCount(finalText),
      phone: result.phone ?? phone,
      username: extractUsername(finalText),
      classification: postType,
      confidence: result.confidence,
      duplicateFingerprint: fingerprint,
      isDuplicate: false,
      messageDate: meta.messageDate,
      collectedAt: new Date().toISOString(),
      mediaType: mediaInfo?.type || null,
      mediaUrl: mediaInfo?.url || null,
    };

    addPost(post); // storage enforces 65 limit (task #4)
    if (broadcast && this.onNewPost) this.onNewPost(post); // task #5

    if (channel) {
      updateChannel(channel.id, {
        totalCollectedPosts: channel.totalCollectedPosts + 1,
        totalPassengerPosts: channel.totalPassengerPosts + 1,
        lastProcessedMessageId: meta.messageId,
        lastEventTime: new Date().toISOString(),
      });
    }
    logger.debug(`New passenger post from ${meta.channelTitle}`);
  }

  private async extractMediaInfo(message: any): Promise<{ type: string; url: string } | null> {
    const media = message?.media;
    if (!media) return null;
    const cls = media.className;
    let type: string | null = null;
    if (cls === 'MessageMediaPhoto') type = 'photo';
    else if (cls === 'MessageMediaDocument') {
      const attrs = media.document?.attributes || [];
      type = attrs.find((a: any) => a.className === 'DocumentAttributeVideo') ? 'video' : 'document';
    }
    if (!type) return null;
    const client = this.botClient || this.client;
    if (!client) return { type, url: '' };
    try {
      const uploadsDir = path.resolve(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = type === 'photo' ? 'jpg' : 'dat';
      const fileName = `${message.id}_${Date.now()}.${ext}`;
      const buffer: any = await client.downloadMedia(message, {});
      if (buffer && buffer.length) {
        fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
        return { type, url: `/uploads/${fileName}` };
      }
    } catch (e) {
      logger.error('Media download failed:', e);
    }
    return { type, url: '' };
  }

  // Backfill recent posts from a channel (used when a channel is added)
  async backfillChannel(username: string, limit = config.storage.maxPosts): Promise<number> {
    const client = this.client || this.botClient;
    if (!client) return 0;
    try {
      const entity: any = await client.getEntity(username);
      const messages: any[] = await client.getMessages(entity, { limit });
      const cid = entity.id?.toString?.() || entity.channelId?.toString() || username;
      const ch = getChannelByChannelId(cid);
      const title = entity.title || username;
      const url = `https://t.me/${String(username).replace('@', '')}`;
      let count = 0;
      for (const m of messages.slice().reverse()) {
        const text = typeof m.message === 'string' ? m.message : '';
        if (!text && !m.media) continue;
        await this.processIncoming(text, m, {
          channelId: cid,
          channelTitle: ch?.title || title,
          channelUrl: ch?.url || url,
          messageId: m.id,
          messageDate: m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString(),
        }, ch || null, false); // silent (no toast spam)
        count++;
      }
      logger.info(`Backfilled ${count} posts from ${username}`);
      return count;
    } catch (e) {
      logger.error('Backfill failed for', username, e);
      return 0;
    }
  }

  // Resolve a channel title (used when a channel is not registered)
  private async resolveTitle(channelId: string): Promise<string> {
    if (this.titleCache[channelId]) return this.titleCache[channelId];
    const client = this.client || this.botClient;
    if (!client) return 'Channel ' + channelId;
    try {
      const e: any = await client.getEntity(channelId);
      const t = e.title || 'Channel ' + channelId;
      this.titleCache[channelId] = t;
      return t;
    } catch {
      return 'Channel ' + channelId;
    }
  }

  // Enumerate all channels the connected client can see
  private async enumerateChannels(): Promise<{ channelId: string; title: string; username: string; url: string }[]> {
    const client = this.client || this.botClient;
    if (!client) return [];
    try {
      const dialogs: any[] = await client.getDialogs({ limit: 200 });
      const res: { channelId: string; title: string; username: string; url: string }[] = [];
      for (const d of dialogs) {
        const e = d.entity;
        if (e && e.className === 'Channel') {
          const username = e.username ? '@' + e.username : '';
          res.push({
            channelId: (e.id?.toString?.() || e.channelId?.toString()) as string,
            title: e.title || username,
            username,
            url: e.username ? `https://t.me/${e.username}` : '',
          });
        }
      }
      return res;
    } catch (e) {
      logger.error('enumerateChannels failed:', e);
      return [];
    }
  }

  // Backfill passengers from ALL accessible channels for the last `days` days (task: 1-week history)
  async backfillAll(days = 7): Promise<{ channels: number; posts: number }> {
    const client = this.client || this.botClient;
    if (!client) return { channels: 0, posts: 0 };
    // Faqat ro'yxatdan o'tgan (allowlist) kanallar — barcha dialoglar emas
    const channels = getActiveChannels();
    const since = Date.now() - days * 864e5;
    let total = 0;
    for (const ch of channels) {
      try {
        const entity: any = await client.getEntity(ch.channelId);
        const messages: any[] = await client.getMessages(entity, { limit: 1000 });
        for (const m of messages) {
          if (!m) continue;
          const date = m.date ? new Date(m.date * 1000).getTime() : 0;
          if (date < since) continue;
          const text = typeof m.message === 'string' ? m.message : '';
          if (!text && !m.media) continue;
          await this.processIncoming(text, m, {
            channelId: ch.channelId,
            channelTitle: ch.title,
            channelUrl: ch.url,
          messageId: m.id,
          messageDate: m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString(),
        }, null, false, false); // silent, no media download
        total++;
        }
      } catch {
        // skip channel on error
      }
    }
    logger.info(`backfillAll: ${channels.length} channels scanned, ${total} passenger posts added (last ${days}d)`);
    return { channels: channels.length, posts: total };
  }
}

export const telegramCollector = new TelegramCollector();
