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

class TelegramCollector {
  private client: TelegramClient | null = null;
  private connected = false;
  private onNewPost: NewPostHandler | null = null;

  async connect(): Promise<void> {
    if (this.connected) return;

    // Skip if no session configured
    if (!config.telegram.session) {
      logger.warn('Telegram session not configured. Skipping Telegram connection.');
      logger.warn('Run: npx ts-node login.ts to generate a session');
      return;
    }

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

      this.connected = true;
      logger.info('Telegram client connected');

      const sessionString = session.save();
      if (!config.telegram.session) {
        logger.info('Save this session:', sessionString);
      }

      this.setupEventListeners();

      // Auto-discover channels from the configured Telegram folder
      await this.syncFolderChannels(config.telegram.folder).catch((err) => {
        logger.error('Failed to sync folder channels:', err);
      });
    } catch (error) {
      logger.error('Telegram connection failed:', error);
    }
  }

  /**
   * Discover all channels inside a Telegram folder (e.g. "taxi") and register
   * them as active collection channels. Matching is done by the numeric Telegram
   * channelId so incoming messages from these channels are processed.
   */
  async syncFolderChannels(folderName: string): Promise<Channel[]> {
    if (!this.client || !this.connected) {
      throw new Error('Telegram client not connected');
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

      const channel: Channel = {
        id: `ch-${numericId}`,
        channelId: numericId,
        username,
        title,
        url,
        status: 'active',
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

  private setupEventListeners(): void {
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

          const text = message.message;
          const messageId = message.id;
          const messageDate = new Date(message.date * 1000).toISOString();

          // Classify
          const result = classifyMessage(text);

          // Only process passengers
          if (result.classification !== 'passenger') {
            await updateChannel(channel.id, {
              totalCollectedPosts: channel.totalCollectedPosts + 1,
              totalDriverPosts: channel.totalDriverPosts + (result.classification === 'driver' ? 1 : 0),
            });
            return;
          }

          // Check duplicate
          const fingerprint = generateFingerprint(text);
          const phone = extractPhone(text);
          const isDuplicate = !!(phone && findPostByPhone(phone)) || !!findPostByFingerprint(fingerprint);

          const post: Post = {
            id: `${channelId}_${messageId}`,
            messageId,
            channelId: channel.channelId,
            channelTitle: channel.title,
            channelUrl: channel.url,
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
            messageDate,
            collectedAt: new Date().toISOString(),
          };

          if (!isDuplicate) {
            addPost(post);
            if (this.onNewPost) this.onNewPost(post);
          }

          // Update channel stats
          await updateChannel(channel.id, {
            lastProcessedMessageId: messageId,
            lastEventTime: new Date().toISOString(),
            totalCollectedPosts: channel.totalCollectedPosts + 1,
            totalPassengerPosts: channel.totalPassengerPosts + 1,
          });
        }
      } catch (error) {
        logger.error('Error processing Telegram update:', error);
      }
    });
  }

  onPost(handler: NewPostHandler): void {
    this.onNewPost = handler;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }
}

export const telegramCollector = new TelegramCollector();
