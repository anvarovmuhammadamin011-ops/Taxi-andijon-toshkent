import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Post, User, Channel, Settings, UserNotification, SavedPost } from '../types';
import { logger } from '../utils/logger';

// JSON File Storage - No MongoDB needed
// Data is persisted to local JSON files

const DATA_DIR = path.resolve(config.storage.dataDir);

interface DataStore {
  posts: Post[];
  users: User[];
  channels: Channel[];
  settings: Settings;
  notifications: UserNotification[];
  savedPosts: SavedPost[];
}

let store: DataStore = {
  posts: [],
  users: [],
  channels: [],
  settings: {
    adminTelegramUsername: config.admin.telegramUsername,
    maxPosts: config.storage.maxPosts,
    classifierThreshold: 0.6,
  },
  notifications: [],
  savedPosts: [],
};

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = getFilePath(filename);
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.error(`Failed to load ${filename}:`, error);
    }
  }
  return defaultValue;
}

function saveFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = getFilePath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    logger.error(`Failed to save ${filename}:`, error);
  }
}

export function loadAll(): void {
  store.posts = loadFile<Post[]>('posts.json', []);
  store.users = loadFile<User[]>('users.json', []);
  store.channels = loadFile<Channel[]>('channels.json', []);
  store.settings = loadFile<Settings>('settings.json', store.settings);
  store.notifications = loadFile<UserNotification[]>('notifications.json', []);
  store.savedPosts = loadFile<SavedPost[]>('saved.json', []);
  logger.info(`Loaded ${store.posts.length} posts, ${store.users.length} users, ${store.channels.length} channels`);
  seedIfEmpty();
}

export function saveAll(): void {
  saveFile('posts.json', store.posts);
  saveFile('users.json', store.users);
  saveFile('channels.json', store.channels);
  saveFile('settings.json', store.settings);
  saveFile('notifications.json', store.notifications);
  saveFile('saved.json', store.savedPosts);
}

// Seed default data on first run (empty storage)
function seedIfEmpty(): void {
  if (store.users.length > 0 || store.channels.length > 0) return;

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  addChannel({
    id: 'ch-taxsislar',
    channelId: 'taxsislar',
    username: 'taxsislar',
    title: 'Taksilar',
    url: 'https://t.me/taxsislar',
    status: 'active',
    lastProcessedMessageId: 0,
    lastEventTime: null,
    totalCollectedPosts: 0,
    totalPassengerPosts: 0,
    totalDriverPosts: 0,
    addedAt: now.toISOString(),
  });

  addUser({
    id: 'test-user-1',
    name: 'Test User',
    telegramId: 8877452838,
    login: 'test',
    passwordHash: '$2a$10$NcKplwoOyjhHtf..5CwZ.uf/C8ekw9zQV1zdmevhdiHg135jApmHO',
    role: 'user',
    status: 'active',
    monthlyPrice: 50000,
    subscriptionStart: now.toISOString(),
    subscriptionEnd: endDate.toISOString(),
    settings: {
      darkMode: false,
      notifications: true,
      defaultRoute: 'toshkent_andijon',
      language: 'uz',
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  const testTexts = [
    { text: 'Тошкентга юрамиз 2та кам машина kerak', route: 'toshkent_andijon' as const, phone: '998218408' },
    { text: 'Andijonga ketmoqchiman, 3 kishi, mashina kerak', route: 'andijon_toshkent' as const, phone: '901234567' },
    { text: 'Тошкентдан Баликчига юрамиз 2 та одамимиз кам', route: 'toshkent_andijon' as const, phone: '998765432' },
  ];
  testTexts.forEach((p, i) => {
    addPost({
      id: `test-post-${Date.now()}-${i}`,
      messageId: 1000 + i,
      channelId: 'taxsislar',
      channelTitle: 'Taksilar',
      channelUrl: 'https://t.me/taxsislar',
      originalText: p.text,
      normalizedText: p.text.toLowerCase(),
      route: p.route,
      passengerCount: 2,
      phone: p.phone,
      username: null,
      classification: 'passenger',
      confidence: 0.9,
      duplicateFingerprint: p.text.slice(0, 20),
      isDuplicate: false,
      messageDate: now.toISOString(),
      collectedAt: now.toISOString(),
    });
  });

  logger.info('Seeded default test user (test / test123), channel and sample posts');
}

// Post operations
export function getPosts(): Post[] {
  return store.posts;
}

export function addPost(post: Post): void {
  store.posts.unshift(post);
  // Enforce max posts limit (FIFO)
  if (store.posts.length > store.settings.maxPosts) {
    store.posts = store.posts.slice(0, store.settings.maxPosts);
  }
  saveFile('posts.json', store.posts);
}

export function removePost(id: string): void {
  store.posts = store.posts.filter((p) => p.id !== id);
  saveFile('posts.json', store.posts);
}

export function findPostByFingerprint(fingerprint: string): Post | undefined {
  return store.posts.find((p) => p.duplicateFingerprint === fingerprint);
}

export function findPostByPhone(phone: string): Post | undefined {
  return store.posts.find((p) => p.phone === phone && p.classification === 'passenger');
}

// User operations
export function getUsers(): User[] {
  return store.users;
}

export function getUserById(id: string): User | undefined {
  return store.users.find((u) => u.id === id);
}

export function getUserByLogin(login: string): User | undefined {
  return store.users.find((u) => u.login === login);
}

export function getUserByTelegramId(telegramId: number): User | undefined {
  return store.users.find((u) => u.telegramId === telegramId);
}

export function addUser(user: User): void {
  store.users.push(user);
  saveFile('users.json', store.users);
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  store.users[idx] = { ...store.users[idx], ...updates, updatedAt: new Date().toISOString() };
  saveFile('users.json', store.users);
  return store.users[idx];
}

export function deleteUser(id: string): void {
  store.users = store.users.filter((u) => u.id !== id);
  saveFile('users.json', store.users);
}

// Channel operations
export function getChannels(): Channel[] {
  return store.channels;
}

export function getActiveChannels(): Channel[] {
  return store.channels.filter((c) => c.status === 'active');
}

export function getChannelById(id: string): Channel | undefined {
  return store.channels.find((c) => c.id === id);
}

export function getChannelByChannelId(channelId: string): Channel | undefined {
  return store.channels.find((c) => c.channelId === channelId);
}

export function addChannel(channel: Channel): void {
  store.channels.push(channel);
  saveFile('channels.json', store.channels);
}

export function updateChannel(id: string, updates: Partial<Channel>): Channel | undefined {
  const idx = store.channels.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  store.channels[idx] = { ...store.channels[idx], ...updates };
  saveFile('channels.json', store.channels);
  return store.channels[idx];
}

export function deleteChannel(id: string): void {
  store.channels = store.channels.filter((c) => c.id !== id);
  saveFile('channels.json', store.channels);
}

// Settings operations
export function getSettings(): Settings {
  return store.settings;
}

export function updateSettings(updates: Partial<Settings>): Settings {
  store.settings = { ...store.settings, ...updates };
  saveFile('settings.json', store.settings);
  return store.settings;
}

// Saved posts operations
export function getSavedPostIds(userId: string): string[] {
  return store.savedPosts
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((s) => s.postId);
}

export function isPostSaved(userId: string, postId: string): boolean {
  return store.savedPosts.some((s) => s.userId === userId && s.postId === postId);
}

export function toggleSavedPost(userId: string, postId: string): { saved: boolean } {
  const existing = store.savedPosts.find((s) => s.userId === userId && s.postId === postId);
  if (existing) {
    store.savedPosts = store.savedPosts.filter((s) => s !== existing);
    saveFile('saved.json', store.savedPosts);
    return { saved: false };
  }
  store.savedPosts.push({ userId, postId, savedAt: new Date().toISOString() });
  saveFile('saved.json', store.savedPosts);
  return { saved: true };
}

// Notifications operations
export function getNotifications(userId: string): UserNotification[] {
  return store.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(userId: string): number {
  return store.notifications.filter((n) => n.userId === userId && !n.read).length;
}

export function addNotification(notification: UserNotification): void {
  store.notifications.push(notification);
  // Keep max 100 notifications per user
  const userNotifs = store.notifications.filter((n) => n.userId === notification.userId);
  if (userNotifs.length > 100) {
    const excess = userNotifs.length - 100;
    const removalIds = new Set(userNotifs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, excess).map((n) => n.id));
    store.notifications = store.notifications.filter((n) => !removalIds.has(n.id));
  }
  saveFile('notifications.json', store.notifications);
}

export function markNotificationsRead(userId: string): void {
  store.notifications = store.notifications.map((n) =>
    n.userId === userId ? { ...n, read: true } : n
  );
  saveFile('notifications.json', store.notifications);
}

export function clearNotifications(userId: string): void {
  store.notifications = store.notifications.filter((n) => n.userId !== userId);
  saveFile('notifications.json', store.notifications);
}
