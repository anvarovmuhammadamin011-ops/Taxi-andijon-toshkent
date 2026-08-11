import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Post, User, Channel, Settings } from '../types';
import { logger } from '../utils/logger';

// JSON File Storage - No MongoDB needed
// Data is persisted to local JSON files

const DATA_DIR = path.resolve(config.storage.dataDir);

interface DataStore {
  posts: Post[];
  users: User[];
  channels: Channel[];
  settings: Settings;
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
  logger.info(`Loaded ${store.posts.length} posts, ${store.users.length} users, ${store.channels.length} channels`);
}

export function saveAll(): void {
  saveFile('posts.json', store.posts);
  saveFile('users.json', store.users);
  saveFile('channels.json', store.channels);
  saveFile('settings.json', store.settings);
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
