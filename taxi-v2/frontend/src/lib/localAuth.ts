import { User, UserSettings, Post, UserNotification } from './types';

// All user data (accounts, passwords, saved posts, notifications, settings,
// subscription) is stored locally in the browser via localStorage. The backend
// only serves Telegram posts and manages channel collection.

const USERS_KEY = 'taxi_users';
const SESSION_KEY = 'taxi_session';
const SAVED_KEY = 'taxi_saved'; // Record<userId, Post[]>
const NOTIF_KEY = 'taxi_notif'; // Record<userId, UserNotification[]>

// Admin key used to protect backend channel-management endpoints. The owner sets
// VITE_ADMIN_API_KEY on Vercel (and ADMIN_API_KEY on Render) to harden it.
export const ADMIN_API_KEY: string = (import.meta.env.VITE_ADMIN_API_KEY as string) || 'taxi-admin';

function hashPassword(pw: string): string {
  // Local-only obfuscation (NOT cryptographically secure). Avoids storing the
  // raw password in plaintext. Acceptable for a single-device mini-app.
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (h << 5) - h + pw.charCodeAt(i);
    h |= 0;
  }
  return 'h' + (h >>> 0).toString(16);
}

interface LocalUser extends User {
  passwordHash: string;
  updatedAt: string;
}

function strip(u: LocalUser): User {
  const { passwordHash, ...safe } = u;
  return safe;
}

function normalizeUser(u: any): LocalUser {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return {
    id: u.id || 'u-' + Date.now(),
    name: u.name || 'User',
    telegramId: u.telegramId ?? 0,
    login: u.login || '',
    role: u.role || 'user',
    status: u.status || 'active',
    monthlyPrice: u.monthlyPrice ?? 50000,
    subscriptionStart: u.subscriptionStart || now.toISOString(),
    subscriptionEnd: u.subscriptionEnd || end.toISOString(),
    settings: {
      darkMode: !!u.settings?.darkMode,
      notifications: u.settings?.notifications ?? true,
      defaultRoute: u.settings?.defaultRoute || 'toshkent_andijon',
      language: u.settings?.language || 'uz',
    },
    passwordHash: u.passwordHash || '',
    updatedAt: u.updatedAt || now.toISOString(),
  };
}

function readUsers(): LocalUser[] {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return (Array.isArray(raw) ? raw : []).map(normalizeUser);
  } catch {
    return [];
  }
}

function writeUsers(users: LocalUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedIfEmpty(): void {
  const users = readUsers();
  if (users.length > 0) {
    ensureAdmin();
    ensureDemo();
    return;
  }
  writeUsers([makeAdmin(), makeTestUser()]);
}

function makeTestUser(): LocalUser {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return {
    id: 'demo-test',
    name: 'Test Foydalanuvchi',
    telegramId: 0,
    login: 'test',
    role: 'user',
    status: 'active',
    monthlyPrice: 50000,
    subscriptionStart: now.toISOString(),
    subscriptionEnd: end.toISOString(),
    settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
    passwordHash: hashPassword('test'),
    updatedAt: now.toISOString(),
  };
}

function ensureDemo(): void {
  const users = readUsers();
  if (users.find((u) => u.login === 'test')) return;
  writeUsers([...users, makeTestUser()]);
}

function makeAdmin(): LocalUser {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return {
    id: 'local-admin',
    name: 'Admin',
    telegramId: 0,
    login: 'admin',
    role: 'admin',
    status: 'active',
    monthlyPrice: 50000,
    subscriptionStart: now.toISOString(),
    subscriptionEnd: end.toISOString(),
    settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
    passwordHash: hashPassword('admin'),
    updatedAt: now.toISOString(),
  };
}

function ensureAdmin(): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.login === 'admin');
  const correct = hashPassword('admin');
  if (idx === -1) {
    writeUsers([...users, makeAdmin()]);
    return;
  }
  const admin = users[idx];
  if (admin.passwordHash !== correct) {
    admin.passwordHash = correct;
    writeUsers(users);
  }
}

export function registerUser(name: string, login: string, password: string): { ok: boolean; error?: string } {
  seedIfEmpty();
  const users = readUsers();
  if (users.find((u) => u.login === login)) return { ok: false, error: 'Bu login band' };
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  const user: LocalUser = {
    id: 'u-' + Date.now(),
    name,
    login,
    telegramId: 0,
    role: 'user',
    status: 'active',
    monthlyPrice: 50000,
    subscriptionStart: now.toISOString(),
    subscriptionEnd: end.toISOString(),
    settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
    passwordHash: hashPassword(password),
    updatedAt: now.toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { ok: true };
}

export function loginUser(login: string, password: string): { ok: boolean; user?: User; error?: string } {
  seedIfEmpty();
  const users = readUsers();
  const u = users.find((x) => x.login === login);
  if (!u || u.passwordHash !== hashPassword(password)) return { ok: false, error: "Login yoki parol noto'g'ri" };
  if (u.status === 'blocked') return { ok: false, error: 'Akkaunt bloklangan' };
  localStorage.setItem(SESSION_KEY, u.id);
  return { ok: true, user: strip(u) };
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const u = readUsers().find((x) => x.id === id);
  if (!u) {
    logoutUser();
    return null;
  }
  return strip(u);
}

export function updateUserSettings(userId: string, s: Partial<UserSettings>): User | null {
  const users = readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return null;
  users[idx].settings = { ...users[idx].settings, ...s };
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return strip(users[idx]);
}

export function extendSubscription(userId: string, months = 1): User | null {
  const users = readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return null;
  const end = new Date(users[idx].subscriptionEnd);
  if (end < new Date()) end.setTime(Date.now());
  end.setMonth(end.getMonth() + months);
  users[idx].subscriptionEnd = end.toISOString();
  users[idx].status = 'active';
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return strip(users[idx]);
}

export function setUserStatus(userId: string, status: string): User | null {
  const users = readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return null;
  users[idx].status = status as User['status'];
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return strip(users[idx]);
}

export function deleteUser(userId: string): void {
  const users = readUsers().filter((x) => x.id !== userId);
  writeUsers(users);
  const saved = readSaved();
  delete saved[userId];
  writeSaved(saved);
  const notif = readNotif();
  delete notif[userId];
  writeNotif(notif);
}

export interface AddUserInput {
  name: string;
  telegramId: number;
  login: string;
  password: string;
  monthlyPrice: number;
  subscriptionMonths: number;
}

export function addUserByAdmin(input: AddUserInput): { ok: boolean; error?: string } {
  const users = readUsers();
  if (users.find((u) => u.login === input.login)) return { ok: false, error: 'Bu login band' };
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + (input.subscriptionMonths || 1));
  const user: LocalUser = {
    id: 'u-' + Date.now(),
    name: input.name,
    login: input.login,
    telegramId: input.telegramId || 0,
    role: 'user',
    status: 'active',
    monthlyPrice: input.monthlyPrice || 50000,
    subscriptionStart: now.toISOString(),
    subscriptionEnd: end.toISOString(),
    settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
    passwordHash: hashPassword(input.password || '123456'),
    updatedAt: now.toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { ok: true };
}

export interface UpdateUserAdminInput {
  name?: string;
  login?: string;
  telegramId?: number;
  monthlyPrice?: number;
  subscriptionEnd?: string;
  password?: string;
  status?: string;
}

export function updateUserAdmin(userId: string, patch: UpdateUserAdminInput): User | null {
  const users = readUsers();
  const idx = users.findIndex((x) => x.id === userId);
  if (idx === -1) return null;
  const u = users[idx];
  if (patch.name !== undefined) u.name = patch.name;
  if (patch.login !== undefined) u.login = patch.login;
  if (patch.telegramId !== undefined) u.telegramId = patch.telegramId;
  if (patch.monthlyPrice !== undefined) u.monthlyPrice = patch.monthlyPrice;
  if (patch.subscriptionEnd !== undefined) u.subscriptionEnd = patch.subscriptionEnd;
  if (patch.status !== undefined) u.status = patch.status as User['status'];
  if (patch.password !== undefined && patch.password) u.passwordHash = hashPassword(patch.password);
  u.updatedAt = new Date().toISOString();
  users[idx] = u;
  writeUsers(users);
  return strip(u);
}

export function getAllUsers(): User[] {
  return readUsers().map(strip);
}

// ---- Saved posts ----
function readSaved(): Record<string, Post[]> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') as Record<string, Post[]>;
  } catch {
    return {};
  }
}
function writeSaved(data: Record<string, Post[]>): void {
  localStorage.setItem(SAVED_KEY, JSON.stringify(data));
}

export function getSavedPosts(userId: string): Post[] {
  return readSaved()[userId] || [];
}

export function toggleSavedPost(userId: string, post: Post): { saved: boolean; posts: Post[] } {
  const all = readSaved();
  const list = all[userId] || [];
  const exists = list.find((p) => p.id === post.id);
  const next = exists ? list.filter((p) => p.id !== post.id) : [post, ...list];
  all[userId] = next;
  writeSaved(all);
  return { saved: !exists, posts: next };
}

// ---- Notifications ----
function readNotif(): Record<string, UserNotification[]> {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') as Record<string, UserNotification[]>;
  } catch {
    return {};
  }
}
function writeNotif(data: Record<string, UserNotification[]>): void {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(data));
}

export function getNotifications(userId: string): UserNotification[] {
  return (readNotif()[userId] || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addNotification(userId: string, notif: UserNotification): UserNotification[] {
  const all = readNotif();
  const list = all[userId] || [];
  if (list.find((n) => n.postId === notif.postId)) return list;
  all[userId] = [notif, ...list].slice(0, 100);
  writeNotif(all);
  return all[userId];
}

export function markNotificationsRead(userId: string): UserNotification[] {
  const all = readNotif();
  all[userId] = (all[userId] || []).map((n) => ({ ...n, read: true }));
  writeNotif(all);
  return all[userId];
}
