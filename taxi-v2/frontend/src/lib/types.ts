export type RouteId = 'toshkent_andijon' | 'andijon_toshkent' | 'unknown';

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
  classification: string;
  confidence: number;
  isDuplicate: boolean;
  duplicateFingerprint: string;
  messageDate: string;
  collectedAt: string;
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
  role: 'user' | 'admin';
  status: string;
  monthlyPrice: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  settings: UserSettings;
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

export interface RouteInfo {
  id: RouteId;
  label: string;
  icon: string;
}

export const ROUTES: RouteInfo[] = [
  { id: 'toshkent_andijon', label: 'Toshkent → Andijon', icon: '🕐' },
  { id: 'andijon_toshkent', label: 'Andijon → Toshkent', icon: '🕐' },
];

export function routeLabel(id: string): string {
  return ROUTES.find((r) => r.id === id)?.label || id;
}