import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { Post, User, Channel, Settings, UserNotification, SavedPost, UserStatus } from '../types';
import { logger } from '../utils/logger';

const DATA_DIR = path.resolve(config.storage.dataDir);

interface DataStore {
  posts: Post[];
  driverPosts: Post[];
  users: User[];
  channels: Channel[];
  settings: Settings;
  notifications: UserNotification[];
  savedPosts: SavedPost[];
}

const DRIVER_BUFFER_CAP = 20;

let store: DataStore = {
  posts: [],
  driverPosts: [],
  users: [],
  channels: [],
  settings: {
    adminTelegramUsername: config.admin.telegramUsername,
    maxPosts: config.storage.maxPosts,
    classifierThreshold: 0.5,
  },
  notifications: [],
  savedPosts: [],
};

function fp(f: string): string {
  return path.join(DATA_DIR, f);
}
function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function load<T>(f: string, d: T): T {
  ensureDir();
  if (fs.existsSync(fp(f))) {
    try {
      return JSON.parse(fs.readFileSync(fp(f), 'utf8')) as T;
    } catch (e) {
      logger.error('load', f, e);
    }
  }
  return d;
}
function save<T>(f: string, d: T): void {
  ensureDir();
  try {
    fs.writeFileSync(fp(f), JSON.stringify(d, null, 2), 'utf8');
  } catch (e) {
    logger.error('save', f, e);
  }
}

export function loadAll(): void {
  store.posts = load<Post[]>('posts.json', []);
  store.driverPosts = load<Post[]>('driverPosts.json', []);
  store.users = load<User[]>('users.json', []);
  store.channels = load<Channel[]>('channels.json', []);
  store.settings = load<Settings>('settings.json', store.settings);
  store.notifications = load<UserNotification[]>('notifications.json', []);
  store.savedPosts = load<SavedPost[]>('saved.json', []);
  logger.info(`Loaded ${store.posts.length} posts, ${store.driverPosts.length} driver posts, ${store.users.length} users, ${store.channels.length} channels`);
  ensureSeedUsers();
}

export function saveAll(): void {
  save('posts.json', store.posts);
  save('driverPosts.json', store.driverPosts);
  save('users.json', store.users);
  save('channels.json', store.channels);
  save('settings.json', store.settings);
  save('notifications.json', store.notifications);
  save('saved.json', store.savedPosts);
}

// Ensures the seeded accounts exist with the desired credentials. Upserts by
// id on every boot so changes apply even when users.json already exists.
function ensureSeedUsers(): void {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  const upsert = (id: string, name: string, login: string, pw: string, role: 'admin' | 'user', tid: number): void => {
    let u = store.users.find((x) => x.id === id);
    if (!u) {
      u = {
        id,
        name,
        telegramId: tid,
        login,
        passwordHash: bcrypt.hashSync(pw, 10),
        role,
        status: 'active',
        monthlyPrice: 50000,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: end.toISOString(),
        settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      } as User;
      store.users.push(u);
    } else {
      u.name = name;
      u.login = login;
      u.passwordHash = bcrypt.hashSync(pw, 10);
      u.telegramId = tid;
      u.role = role;
      u.status = 'active';
      u.subscriptionEnd = u.subscriptionEnd && new Date(u.subscriptionEnd) > now ? u.subscriptionEnd : end.toISOString();
      u.updatedAt = now.toISOString();
    }
  };
  upsert('u-admin', 'Muhammadamin', 'muhammadamin', 'anvarovmuhammadamin', 'admin', 8197456094);
  upsert('u-test', 'Ilyosbek', 'Ilyosbek', 'isyosbek954059494', 'user', 8877452838);
  save('users.json', store.users);
  logger.info('Ensured seeded users: admin (muhammadamin) + test (Ilyosbek)');
}

// ---- Posts ----
export function getPosts(): Post[] {
  return store.posts;
}
export function addPost(post: Post): void {
  store.posts.unshift(post);
  const max = store.settings.maxPosts;
  if (store.posts.length > max) store.posts = store.posts.slice(0, max);
  save('posts.json', store.posts);
}
export function removePost(id: string): void {
  store.posts = store.posts.filter((p) => p.id !== id);
  save('posts.json', store.posts);
}
export function findPostByFingerprint(fp_: string): Post | undefined {
  return store.posts.find((p) => p.duplicateFingerprint === fp_);
}
export function findPostByPhone(phone: string): Post | undefined {
  return store.posts.find((p) => p.phone === phone && p.classification === 'passenger');
}

// ---- Driver sample buffer (supplementary feed when passengers are scarce) ----
export function getDriverPosts(): Post[] {
  return store.driverPosts;
}
export function findDriverPostByFingerprint(fp_: string): Post | undefined {
  return store.driverPosts.find((p) => p.duplicateFingerprint === fp_);
}
export function addDriverPost(post: Post): void {
  if (findDriverPostByFingerprint(post.duplicateFingerprint)) return;
  store.driverPosts.unshift(post);
  if (store.driverPosts.length > DRIVER_BUFFER_CAP) {
    store.driverPosts = store.driverPosts.slice(0, DRIVER_BUFFER_CAP);
  }
  save('driverPosts.json', store.driverPosts);
}

// ---- Users ----
export function getUsers(): User[] {
  return store.users;
}
export function getUserById(id: string): User | undefined {
  return store.users.find((u) => u.id === id);
}
export function getUserByLogin(login: string): User | undefined {
  return store.users.find((u) => u.login === login);
}
export function getUserByTelegramId(tid: number): User | undefined {
  return store.users.find((u) => u.telegramId === tid && tid !== 0);
}
export function addUser(u: User): void {
  store.users.push(u);
  save('users.json', store.users);
}
export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const i = store.users.findIndex((u) => u.id === id);
  if (i === -1) return undefined;
  store.users[i] = { ...store.users[i], ...updates, updatedAt: new Date().toISOString() };
  save('users.json', store.users);
  return store.users[i];
}
export function deleteUser(id: string): void {
  store.users = store.users.filter((u) => u.id !== id);
  save('users.json', store.users);
}

// ---- Channels ----
export function getChannels(): Channel[] {
  return store.channels;
}
export function getActiveChannels(): Channel[] {
  return store.channels.filter((c) => c.status === 'active');
}
export function getChannelByChannelId(channelId: string): Channel | undefined {
  return store.channels.find((c) => c.channelId === channelId);
}
export function getChannelById(id: string): Channel | undefined {
  return store.channels.find((c) => c.id === id);
}
export function addChannel(c: Channel): void {
  store.channels.push(c);
  save('channels.json', store.channels);
}
export function updateChannel(id: string, updates: Partial<Channel>): Channel | undefined {
  const i = store.channels.findIndex((c) => c.id === id);
  if (i === -1) return undefined;
  store.channels[i] = { ...store.channels[i], ...updates };
  save('channels.json', store.channels);
  return store.channels[i];
}
export function deleteChannel(id: string): void {
  store.channels = store.channels.filter((c) => c.id !== id);
  save('channels.json', store.channels);
}

// ---- Settings ----
export function getSettings(): Settings {
  return store.settings;
}
export function updateSettings(u: Partial<Settings>): Settings {
  store.settings = { ...store.settings, ...u };
  save('settings.json', store.settings);
  return store.settings;
}

// ---- Saved ----
export function getSavedPostIds(userId: string): string[] {
  return store.savedPosts
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((s) => s.postId);
}
export function toggleSavedPost(userId: string, postId: string): { saved: boolean } {
  const ex = store.savedPosts.find((s) => s.userId === userId && s.postId === postId);
  if (ex) {
    store.savedPosts = store.savedPosts.filter((s) => s !== ex);
    save('saved.json', store.savedPosts);
    return { saved: false };
  }
  store.savedPosts.push({ userId, postId, savedAt: new Date().toISOString() });
  save('saved.json', store.savedPosts);
  return { saved: true };
}

// ---- Notifications ----
export function addNotification(n: UserNotification): void {
  store.notifications.push(n);
  const userNotifs = store.notifications.filter((x) => x.userId === n.userId);
  if (userNotifs.length > 100) {
    const excess = userNotifs.length - 100;
    const rm = new Set(
      userNotifs
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, excess)
        .map((x) => x.id)
    );
    store.notifications = store.notifications.filter((x) => !rm.has(x.id));
  }
  save('notifications.json', store.notifications);
}
export function getNotifications(userId: string): UserNotification[] {
  return store.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function markNotificationsRead(userId: string): void {
  store.notifications = store.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n));
  save('notifications.json', store.notifications);
}
export function clearNotifications(userId: string): void {
  store.notifications = store.notifications.filter((n) => n.userId !== userId);
  save('notifications.json', store.notifications);
}

// Initialize store
export function initStore(): void {
  ensureDir();
}
