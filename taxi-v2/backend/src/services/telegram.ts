import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getActiveChannels, updateChannel } from '../services/storage';
import { classifyMessage } from '../services/classifier';
import { normalizeText, extractPhone, extractUsername, extractPassengerCount, generateFingerprint, detectRoute } from '../utils/text';
import { addPost, findPostByFingerprint, findPostByPhone } from '../services/storage';
import { Post } from '../types';

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
    } catch (error) {
      logger.error('Telegram connection failed:', error);
    }
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
