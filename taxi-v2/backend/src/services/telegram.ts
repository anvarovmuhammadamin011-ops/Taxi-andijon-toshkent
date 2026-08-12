import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getActiveChannels, updateChannel, addChannel, getChannelByChannelId } from '../services/storage';
import { classifyMessage } from '../services/classifier';
import { normalizeText, extractPhone, extractUsername, extractPassengerCount, generateFingerprint, detectRoute } from '../utils/text';
import { addPost, findPostByFingerprint, findPostByPhone } from '../services/storage';
import { Post, Channel } from '../types';

type NewPostHandler = (post: Post) => void;

interface IncomingMeta {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  messageId: number;
  messageDate: string;
}

class TelegramCollector {
  private client: TelegramClient | null = null; // user session (channel monitoring)
  private botClient: TelegramClient | null = null; // bot (forwarded posts)
  private connected = false;
  private onNewPost: NewPostHandler | null = null;

  async connect(): Promise<void> {
    if (this.connected) return;

    const tasks: Promise<void>[] = [];
    if (config.telegram.session) tasks.push(this.connectUser());
    if (config.telegram.botToken) tasks.push(this.connectBot());

    if (tasks.length === 0) {
      logger.warn('No Telegram credentials configured (need TELEGRAM_SESSION or BOT_TOKEN).');
      return;
    }

    await Promise.allSettled(tasks);
    this.connected = !!(this.client || this.botClient);
    logger.info(`Telegram connected: user=${!!this.client}, bot=${!!this.botClient}`);

    if (this.client) {
      await this.syncFolderChannels(config.telegram.folder).catch((err) => {
        logger.error('Failed to sync folder channels:', err);
      });
    }
  }

  // --- User-session client (monitors configured channels) ---
  private async connectUser(): Promise<void> {
    try {
      const session = new StringSession(config.telegram.session);
      this.client = new TelegramClient(session, config.telegram.apiId, config.telegram.apiHash, {
        connectionRetries: 5,
        timeout: 30,
        deviceModel: 'Taxi Collector',
        systemVersion: '1.0',
        appVersion: '1.0',
      });

      await this.client.start({
        phoneNumber: async () => { throw new Error('Session not configured'); },
        phoneCode: async () => { throw new Error('Session not configured'); },
        password: async () => { throw new Error('Session not configured'); },
        onError: (err: any) => { logger.error('Telegram auth error:', err); },
      });

      this.setupChannelHandler();
    } catch (error) {
      logger.error('Telegram user connection failed:', error);
      this.client = null;
    }
  }

  private setupChannelHandler(): void {
    if (!this.client) return;
    this.client.addEventHandler(async (update: any) => {
      try {
        if (update instanceof Api.UpdateNewChannelMessage || update instanceof Api.UpdateNewMessage) {
          const message = update.message as any;
          if (!message || !message.message) return;

          const channelId = message.peerId?.channelId?.toString();
          if (!channelId) return;

          const channels = getActiveChannels();
          const channel = channels.find((c) => c.channelId === channelId);
          if (!channel) return;

          this.processText(message.message, {
            channelId,
            channelTitle: channel.title,
            channelUrl: channel.url,
            messageId: message.id,
            messageDate: new Date(message.date * 1000).toISOString(),
          }, channel);
        }
      } catch (error) {
        logger.error('Error processing Telegram update:', error);
      }
    });
  }

  // --- Bot client (receives forwarded posts sent to the bot) ---
  private async connectBot(): Promise<void> {
    try {
      const session = new StringSession('');
      this.botClient = new TelegramClient(session, config.telegram.apiId, config.telegram.apiHash, {
        connectionRetries: 5,
        timeout: 30,
        deviceModel: 'Taxi Collector Bot',
        systemVersion: '1.0',
        appVersion: '1.0',
      });

      await this.botClient.start({ botToken: config.telegram.botToken } as any);
      logger.info('Telegram bot connected');
      this.setupBotHandler();
    } catch (error) {
      logger.error('Telegram bot connection failed:', error);
      this.botClient = null;
    }
  }

  private setupBotHandler(): void {
    if (!this.botClient) return;
    this.botClient.addEventHandler(async (update: any) => {
      try {
        if (!(update instanceof Api.UpdateNewMessage)) return;
        const message = update.message as any;
        if (!message || message.out || !message.message) return;

        const fwd = message.fwd_from;
        const channelId = fwd?.fromId?.channelId?.toString() || 'bot';
        const channelTitle = (fwd?.fromName as string) || 'Bot (forwarded)';
        const channelUrl = fwd?.fromId?.channelId ? `https://t.me/c/${fwd.fromId.channelId}` : '';

        this.processText(message.message, {
          channelId,
          channelTitle,
          channelUrl,
          messageId: message.id,
          messageDate: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
        }, null);
      } catch (error) {
        logger.error('Error processing bot update:', error);
      }
    });
  }

  // Shared classification + persistence
  private processText(text: string, meta: IncomingMeta, channel: { id: string; totalCollectedPosts: number; totalPassengerPosts: number; totalDriverPosts: number } | null): void {
    const result = classifyMessage(text);

    if (channel) {
      updateChannel(channel.id, {
        totalCollectedPosts: channel.totalCollectedPosts + 1,
        totalDriverPosts: channel.totalDriverPosts + (result.classification === 'driver' ? 1 : 0),
        lastProcessedMessageId: meta.messageId,
        lastEventTime: new Date().toISOString(),
      });
    }

    // Only store passenger posts
    if (result.classification !== 'passenger') return;

    const fingerprint = generateFingerprint(text);
    const phone = extractPhone(text);
    const isDuplicate = !!(phone && findPostByPhone(phone)) || !!findPostByFingerprint(fingerprint);

    const post: Post = {
      id: `${meta.channelId}_${meta.messageId}`,
      messageId: meta.messageId,
      channelId: meta.channelId,
      channelTitle: meta.channelTitle,
      channelUrl: meta.channelUrl,
      originalText: text,
      normalizedText: normalizeText(text),
      route: detectRoute(text),
      passengerCount: extractPassengerCount(text),
      phone,
      username: extractUsername(text),
      classification: result.classification,
      confidence: result.confidence,
      duplicateFingerprint: fingerprint,
      isDuplicate,
      messageDate: meta.messageDate,
      collectedAt: new Date().toISOString(),
    };

    if (!isDuplicate) {
      addPost(post);
      if (this.onNewPost) this.onNewPost(post);
    }
  }

  /**
   * Discover all channels inside a Telegram folder (e.g. "taxi") and register
   * them as active collection channels. Matching is done by the numeric Telegram
   * channelId so incoming messages from these channels are processed.
   */
  async syncFolderChannels(folderName: string): Promise<Channel[]> {
    if (!this.client || !this.connected) {
      throw new Error('Telegram user client not connected');
    }

    let filters: any;
    try {
      filters = await this.client.invoke(new Api.messages.GetDialogFilters());
    } catch (error) {
      logger.error('GetDialogFilters failed:', error);
      return [];
    }

    const list = Array.isArray(filters?.filters) ? filters.filters : [];
    const filter = list.find(
      (f: any) => f.className === 'DialogFilter' && f.title && f.title.toLowerCase() === folderName.toLowerCase()
    );

    if (!filter) {
      logger.warn(`Telegram folder "${folderName}" not found. Available folders: ${list.map((f: any) => f.title).join(', ') || 'none'}`);
      return [];
    }

    logger.info(`Syncing channels from Telegram folder "${folderName}" (id=${filter.id})`);

    let dialogs: any[] = [];
    try {
      dialogs = await this.client.getDialogs({ folder: filter.id, limit: 200 });
    } catch (error) {
      logger.error('getDialogs for folder failed:', error);
      return [];
    }

    const discovered: Channel[] = [];
    for (const dialog of dialogs) {
      const entity: any = dialog.entity;
      if (!entity || entity.className !== 'Channel') continue;

      const numericId = entity.id?.toString();
      if (!numericId) continue;

      const username = entity.username || '';
      const title = entity.title || username || numericId;
      const url = username ? `https://t.me/${username}` : `https://t.me/c/${numericId}`;

      const existing = getChannelByChannelId(numericId);
      if (existing) {
        updateChannel(existing.id, { title, username, url, status: 'active' });
        discovered.push({ ...existing, title, username, url, status: 'active' });
        continue;
      }

      const channel = {
        id: `ch-${numericId}`,
        channelId: numericId,
        username,
        title,
        url,
        status: 'active' as const,
        lastProcessedMessageId: 0,
        lastEventTime: null,
        totalCollectedPosts: 0,
        totalPassengerPosts: 0,
        totalDriverPosts: 0,
        addedAt: new Date().toISOString(),
      };
      addChannel(channel);
      discovered.push(channel);
    }

    logger.info(`Discovered ${discovered.length} channels from folder "${folderName}"`);
    return discovered;
  }

  onPost(handler: NewPostHandler): void {
    this.onNewPost = handler;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.client) await this.client.disconnect();
    if (this.botClient) await this.botClient.disconnect();
    this.connected = false;
    this.client = null;
    this.botClient = null;
  }
}

export const telegramCollector = new TelegramCollector();
