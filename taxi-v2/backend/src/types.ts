export type RouteId = 'toshkent_andijon' | 'andijon_toshkent' | 'unknown';
export type Classification = 'passenger' | 'driver' | 'unknown';
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'blocked' | 'expired';

export interface Post {
  id: string;
  messageId: number;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  originalText: string;
  normalizedText: string;
  route: RouteId;
  passengerCount: number | null;
  phone: string | null;
  username: string | null;
  classification: Classification;
  confidence: number;
  duplicateFingerprint: string;
  isDuplicate: boolean;
  messageDate: string;
  collectedAt: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
}

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  defaultRoute: RouteId;
  language: 'uz' | 'ru';
}

export interface User {
  id: string;
  name: string;
  telegramId: number;
  login: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  monthlyPrice: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  channelId: string;
  username: string;
  title: string;
  url: string;
  status: 'active' | 'paused';
  lastProcessedMessageId: number;
  lastEventTime: string | null;
  totalCollectedPosts: number;
  totalPassengerPosts: number;
  totalDriverPosts: number;
  addedAt: string;
}

export interface Settings {
  adminTelegramUsername: string;
  maxPosts: number;
  classifierThreshold: number;
}

export interface UserNotification {
  id: string;
  userId: string;
  postId: string;
  route: RouteId;
  passengerCount: number | null;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface SavedPost {
  userId: string;
  postId: string;
  savedAt: string;
}
