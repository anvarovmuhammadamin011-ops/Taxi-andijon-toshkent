export interface PostSource {
  channelId: string;
  channelTitle: string;
}

export interface Post {
  id: string;
  channelId: string;
  channelTitle: string;
  channelAvatar?: string;
  channelUrl: string;
  text: string;
  image?: string;
  route: string;
  from: string;
  to: string;
  phone?: string;
  driverName?: string;
  seats?: number;
  postedAt: string;
  messageId: number;
  alsoIn: PostSource[];
}

export interface Channel {
  id: string;
  title: string;
  avatar?: string;
  url: string;
  postCount: number;
  isActive: boolean;
  addedAt: string;
}

export interface RouteInfo {
  from: string;
  to: string;
  color: string;
  postCount: number;
  emoji: string;
}

export type FilterId = "all" | "tashkent-andijon" | "andijon-tashkent";

export interface RouteFilter {
  id: FilterId;
  label: string;
}

export interface AppUser {
  id: string;
  telegramId: number;
  name: string;
  username?: string;
  registeredAt: string;
  vip: boolean;
  vipUntil?: string;
  savedPosts: number;
  isBlocked: boolean;
  lastActiveAt: string;
}

export interface RevenuePoint {
  date: string;
  amount: number;
}

export interface RevenueStats {
  today: number;
  month: number;
  total: number;
  vipUsers: number;
  payments: number;
  history: RevenuePoint[];
}

export interface VipPlan {
  id: string;
  period: string;
  price: number;
}

export interface AppConfig {
  cities: string[];
  postLimit: number;
  keywords: string[];
  plans: VipPlan[];
  isAdmin: boolean;
}

export interface DashboardStats {
  users: number;
  activeToday: number;
  vip: number;
  todayPosts: number;
  activeChannels: number;
  revenueToday: number;
  revenueTotal: number;
  topRoute: string;
  topRouteCount: number;
}

export interface IncomingResult {
  raw: string;
  parsed: {
    phone?: string;
    people?: number;
    from?: string;
    to?: string;
    route: string;
  };
  status: "new" | "duplicate";
  post?: Post;
  duplicatedFrom?: Post;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  isAdmin: boolean;
  isVip: boolean;
  vipUntil?: string;
  favoritesCount: number;
}
