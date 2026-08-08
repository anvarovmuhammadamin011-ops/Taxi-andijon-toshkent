import {
  AppConfig,
  AppUser,
  Channel,
  DashboardStats,
  IncomingResult,
  Post,
  RevenueStats,
} from "../types";
import {
  demoChannels,
  demoKeywords,
  demoPlans,
  demoPosts,
  demoRevenue,
  demoUsers,
  rawSamples,
} from "../data/demo";
import { parsePost } from "./parser";
import { findDuplicates } from "./duplicate";

export const DEFAULT_POST_LIMIT = 100;
export const DEFAULT_ADMIN_IDS = (process.env.ADMIN_IDS ?? "100000001")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => !Number.isNaN(n));

class Store {
  private posts: Post[] = [...demoPosts];
  private channels: Channel[] = [...demoChannels];
  private users: AppUser[] = [...demoUsers];
  private revenue: RevenueStats = { ...demoRevenue, history: [...demoRevenue.history] };
  private keywords: string[] = [...demoKeywords];
  private postLimit = DEFAULT_POST_LIMIT;
  private adminIds: number[] = [...DEFAULT_ADMIN_IDS];
  private seq = demoPosts.length + 100;

  isAdmin(telegramId?: number | string): boolean {
    const n = Number(telegramId);
    return this.adminIds.includes(n);
  }

  getPosts(query?: string, route?: string, channel?: string, since?: string): Post[] {
    let list = [...this.posts];
    const q = query?.toLowerCase().trim();
    if (q) {
      list = list.filter((p) =>
        [p.text, p.from, p.to, p.phone, p.channelTitle, p.driverName]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q))
      );
    }
    if (route) {
      list = list.filter((p) => p.route.toLowerCase() === route.toLowerCase());
    }
    if (channel) {
      list = list.filter((p) => p.channelId === channel);
    }
    if (since) {
      list = list.filter((p) => new Date(p.postedAt).getTime() > new Date(since).getTime());
    }
    return list.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }

  getPost(id: string): Post | undefined {
    return this.posts.find((p) => p.id === id);
  }

  getChannels(): Channel[] {
    return this.channels.map((c) => ({
      ...c,
      postCount: this.posts.filter((p) => p.channelId === c.id).length,
    }));
  }

  addChannel(title: string, url: string): Channel {
    const id = "ch" + (this.channels.length + 100);
    const cleanUrl = url.replace(/^@/, "https://t.me/").replace(/^t\.me\//, "https://t.me/");
    const channel: Channel = {
      id,
      title,
      url: cleanUrl.startsWith("http") ? cleanUrl : `https://t.me/${cleanUrl}`,
      postCount: 0,
      isActive: true,
      addedAt: new Date().toISOString(),
    };
    this.channels.push(channel);
    return channel;
  }

  setChannelActive(id: string, isActive: boolean): Channel | undefined {
    const ch = this.channels.find((c) => c.id === id);
    if (ch) ch.isActive = isActive;
    return ch;
  }

  deleteChannel(id: string): void {
    this.channels = this.channels.filter((c) => c.id !== id);
    this.posts = this.posts.filter((p) => p.channelId !== id);
  }

  getRoutes() {
    const routeSet = new Map<string, { from: string; to: string; count: number }>();
    for (const p of this.posts) {
      const key = `${p.from} -> ${p.to}`;
      const existing = routeSet.get(key);
      if (existing) existing.count++;
      else routeSet.set(key, { from: p.from, to: p.to, count: 1 });
    }
    const colors: Record<string, string> = {
      "Toshkent -> Andijon": "#FFC400",
      "Andijon -> Toshkent": "#B47CFF",
      "Toshkent -> Haqqulobod": "#34D399",
      "Haqqulobod -> Toshkent": "#60A5FA",
      "Toshkent -> Namangan": "#FB923C",
      "Toshkent -> Farg'ona": "#38BDF8",
      "Toshkent -> Qo'qon": "#F472B6",
    };
    const emoji: Record<string, string> = {
      "Toshkent -> Andijon": "🟡",
      "Andijon -> Toshkent": "🟣",
      "Toshkent -> Haqqulobod": "🟢",
      "Haqqulobod -> Toshkent": "🔵",
    };
    return [...routeSet.entries()]
      .map(([key, r]) => ({
        from: r.from,
        to: r.to,
        postCount: r.count,
        color: colors[key] ?? "#8A9499",
        emoji: emoji[key] ?? "⬜",
      }))
      .sort((a, b) => b.postCount - a.postCount);
  }

  addIncoming(raw: string, channel?: Channel): IncomingResult {
    const sourceChannel = channel ?? this.channels[0];
    const parsed = parsePost(raw);
    const nowIso = new Date().toISOString();

    const candidate: Post = {
      id: `p${this.seq++}`,
      channelId: sourceChannel.id,
      channelTitle: sourceChannel.title,
      channelUrl: sourceChannel.url,
      text: raw,
      route: parsed.route,
      from: parsed.from!,
      to: parsed.to!,
      phone: parsed.phone,
      seats: parsed.people,
      postedAt: nowIso,
      messageId: Math.floor(Math.random() * 9000) + 1000,
      alsoIn: [],
    };

    const dups = findDuplicates(candidate, this.posts, parsed.phone);
    if (dups.length > 0) {
      const target = dups[0];
      if (!target.alsoIn.some((s) => s.channelId === sourceChannel.id)) {
        target.alsoIn.push({ channelId: sourceChannel.id, channelTitle: sourceChannel.title });
      }
      return { raw, parsed, status: "duplicate", duplicatedFrom: target };
    }

    this.posts.unshift(candidate);
    this.enforceLimit(candidate.route);
    return { raw, parsed, status: "new", post: candidate };
  }

  simulateIncoming(): IncomingResult {
    const raw = rawSamples[Math.floor(Math.random() * rawSamples.length)];
    const activeChannels = this.channels.filter((c) => c.isActive);
    const channel = activeChannels[Math.floor(Math.random() * activeChannels.length)];
    return this.addIncoming(raw, channel);
  }

  private enforceLimit(route: string): void {
    const routePosts = this.posts
      .filter((p) => p.route === route)
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    if (routePosts.length > this.postLimit) {
      const keep = new Set(routePosts.slice(0, this.postLimit).map((p) => p.id));
      this.posts = this.posts.filter((p) => p.route !== route || keep.has(p.id));
    }
  }

  setPostLimit(limit: number): void {
    this.postLimit = Math.max(20, Math.min(500, Math.floor(limit)));
    for (const route of new Set(this.posts.map((p) => p.route))) {
      this.enforceLimit(route);
    }
  }

  getPostLimit(): number {
    return this.postLimit;
  }

  deletePost(id: string): boolean {
    const before = this.posts.length;
    this.posts = this.posts.filter((p) => p.id !== id);
    return this.posts.length < before;
  }

  getUsers(): AppUser[] {
    return this.users;
  }

  setUserBlocked(id: string, blocked: boolean): AppUser | undefined {
    const u = this.users.find((x) => x.id === id);
    if (u) u.isBlocked = blocked;
    return u;
  }

  getRevenue(): RevenueStats {
    return this.revenue;
  }

  getDashboard(): DashboardStats {
    const activeChannels = this.channels.filter((c) => c.isActive);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayPosts = this.posts.filter((p) => new Date(p.postedAt) >= todayStart).length;
    const routes = this.getRoutes();
    const top = routes[0];
    return {
      users: this.users.length,
      activeToday: this.users.filter((u) => new Date(u.lastActiveAt) >= todayStart).length,
      vip: this.users.filter((u) => u.vip).length,
      todayPosts,
      activeChannels: activeChannels.length,
      revenueToday: this.revenue.today,
      revenueTotal: this.revenue.total,
      topRoute: top ? `${top.from} -> ${top.to}` : "-",
      topRouteCount: top ? top.postCount : 0,
    };
  }

  getConfig(telegramId?: number | string): AppConfig {
    return {
      cities: ["Toshkent", "Andijon", "Haqqulobod", "Namangan", "Farg'ona", "Qo'qon"],
      postLimit: this.postLimit,
      keywords: this.keywords,
      plans: demoPlans,
      isAdmin: this.isAdmin(telegramId),
    };
  }

  addKeyword(kw: string): void {
    const k = kw.trim();
    if (k && !this.keywords.includes(k)) this.keywords.push(k);
  }

  removeKeyword(kw: string): void {
    this.keywords = this.keywords.filter((k) => k !== kw);
  }

  getKeywords(): string[] {
    return this.keywords;
  }
}

export const store = new Store();
