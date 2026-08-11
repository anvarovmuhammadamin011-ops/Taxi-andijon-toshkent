export type Route = 'toshkent_andijon' | 'andijon_toshkent' | 'unknown';
export type Classification = 'passenger' | 'driver' | 'unknown';
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked' | 'expired';
export type ChannelStatus = 'active' | 'inactive';
export type SubscriptionStatus = 'active' | 'expired';

export interface Post {
  id: string;
  messageId: number;
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  originalText: string;
  normalizedText: string;
  route: Route;
  passengerCount: number | null;
  phone: string | null;
  username: string | null;
  classification: Classification;
  confidence: number;
  duplicateFingerprint: string;
  isDuplicate: boolean;
  messageDate: string;
  collectedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  channelId: string;
  username: string;
  title: string;
  url: string;
  status: ChannelStatus;
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

export interface AuthPayload {
  userId: string;
  telegramId: number;
  role: UserRole;
}

export interface LoginRequest {
  login: string;
  password: string;
  initData: string;
}

export interface CreateUserRequest {
  name: string;
  telegramId: number;
  login: string;
  password: string;
  monthlyPrice: number;
  subscriptionMonths: number;
}

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  scores: {
    passenger: number;
    driver: number;
  };
  signals: string[];
}
