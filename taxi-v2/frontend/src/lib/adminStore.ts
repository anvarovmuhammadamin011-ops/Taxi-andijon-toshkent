// Local admin stores (frontend-only). All data lives in localStorage.

import { RouteInfo } from './types';

const PAUSED_KEY = 'taxi_paused_channels';
const ROUTES_KEY = 'taxi_routes';
const SETTINGS_KEY = 'taxi_admin_settings';
const BROADCAST_KEY = 'taxi_broadcast';

export interface AdminSettings {
  appName: string;
  supportUsername: string;
  adminTelegram: string;
  defaultPrice: number;
  maxPosts: number;
}

const DEFAULT_SETTINGS: AdminSettings = {
  appName: 'Taxi Collector',
  supportUsername: '@support',
  adminTelegram: '@admin',
  defaultPrice: 50000,
  maxPosts: 65,
};

export function getPausedChannels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PAUSED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function setChannelPaused(title: string, paused: boolean): void {
  const list = getPausedChannels();
  const next = paused ? Array.from(new Set([...list, title])) : list.filter((t) => t !== title);
  localStorage.setItem(PAUSED_KEY, JSON.stringify(next));
}

export function isChannelPaused(title: string): boolean {
  return getPausedChannels().includes(title);
}

export function getRoutes(): RouteInfo[] {
  try {
    const raw = localStorage.getItem(ROUTES_KEY);
    if (raw) return JSON.parse(raw) as RouteInfo[];
  } catch {
    /* ignore */
  }
  const def: RouteInfo[] = [
    { id: 'toshkent_andijon', label: 'Toshkent → Andijon', icon: '🕐' },
    { id: 'andijon_toshkent', label: 'Andijon → Toshkent', icon: '🕐' },
  ];
  localStorage.setItem(ROUTES_KEY, JSON.stringify(def));
  return def;
}

export function addRoute(label: string): RouteInfo[] {
  const routes = getRoutes();
  const id = label.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || `route_${Date.now()}`;
  if (routes.find((r) => r.id === id)) return routes;
  const next = [...routes, { id, label, icon: '🗺️' }];
  localStorage.setItem(ROUTES_KEY, JSON.stringify(next));
  return next;
}

export function getAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function updateAdminSettings(s: Partial<AdminSettings>): AdminSettings {
  const next = { ...getAdminSettings(), ...s };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export function getBroadcasts(): Broadcast[] {
  try {
    return JSON.parse(localStorage.getItem(BROADCAST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addBroadcast(title: string, message: string): Broadcast[] {
  const list = getBroadcasts();
  const next = [{ id: 'b-' + Date.now(), title, message, createdAt: new Date().toISOString() }, ...list].slice(0, 50);
  localStorage.setItem(BROADCAST_KEY, JSON.stringify(next));
  return next;
}
