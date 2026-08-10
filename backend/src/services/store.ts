import {
  AppConfig,
  AppUser,
  Channel,
  DashboardStats,
  DeliveryConfig,
  DeliveryTarget,
  DeliveryTargetInput,
  DeliveryTask,
  IncomingResult,
  Post,
  RevenueStats,
} from "../types";
import {
  demoKeywords,
  demoPlans,
  rawSamples,
} from "../data/demo";
import { parsePost } from "./parser";
import { findDuplicates } from "./duplicate";
import { loadDb, saveDb } from "./persistence";

export const DEFAULT_POST_LIMIT = 50;

const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  vipDelayMin: 5,
  regularDelayMin: 8,
  priorityDelaySec: 0,
};

const EMPTY_REVENUE: RevenueStats = {
  today: 0,
  month: 0,
  total: 0,
  vipUsers: 0,
  payments: 0,
  history: [],
};

function defaultTargets(): DeliveryTarget[] {
  return [
    {
      id: "t1",
      telegramId: 8877452838,
      channelUsername: "",
      channelTitle: "Prioritet kanal",
      tier: "priority",
      isActive: true,
      addedAt: new Date().toISOString(),
    },
  ];
}

interface DbState {
  posts: Post[];
  channels: Channel[];
  users: AppUser[];
  revenue: RevenueStats;
  keywords: string[];
  postLimit: number;
  seq: number;
  dseq: number;
  deliveryTargets: DeliveryTarget[];
  deliveryQueue: DeliveryTask[];
  deliveryConfig: DeliveryConfig;
  monitorLastId: Record<string, number>;
}

class Store {
  private posts: Post[];
  private channels: Channel[];
  private users: AppUser[];
  private revenue: RevenueStats;
  private keywords: string[];
  private postLimit: number;
  private seq: number;
  private dseq: number;
  private deliveryTargets: DeliveryTarget[];
  private deliveryQueue: DeliveryTask[];
  private deliveryConfig: DeliveryConfig;
  private monitorLastId: Record<string, number> = {};

  constructor() {
    const db = loadDb<DbState>();
    if (db) {
      this.posts = db.posts ?? [];
      this.channels = db.channels ?? [];
      this.users = db.users ?? [];
      this.revenue = db.revenue ?? { ...EMPTY_REVENUE, history: [] };
      this.keywords = db.keywords ?? [...demoKeywords];
      this.postLimit = db.postLimit ?? DEFAULT_POST_LIMIT;
      this.seq = db.seq ?? 100;
      this.dseq = db.dseq ?? 100;
      this.deliveryTargets = db.deliveryTargets ?? defaultTargets();
      this.deliveryQueue = db.deliveryQueue ?? [];
      this.deliveryConfig = db.deliveryConfig ?? { ...DEFAULT_DELIVERY_CONFIG };
      this.monitorLastId = db.monitorLastId ?? {};
    } else {
      this.posts = [];
      this.channels = [];
      this.users = [];
      this.revenue = { ...EMPTY_REVENUE, history: [] };
      this.keywords = [...demoKeywords];
      this.postLimit = DEFAULT_POST_LIMIT;
      this.seq = 100;
      this.dseq = 100;
      this.deliveryTargets = defaultTargets();
      this.deliveryQueue = [];
      this.deliveryConfig = { ...DEFAULT_DELIVERY_CONFIG };
      this.monitorLastId = {};
    }
    this.save();
  }

  private save(): void {
    saveDb<DbState>({
      posts: this.posts,
      channels: this.channels,
      users: this.users,
      revenue: this.revenue,
      keywords: this.keywords,
      postLimit: this.postLimit,
      seq: this.seq,
      dseq: this.dseq,
      deliveryTargets: this.deliveryTargets,
      deliveryQueue: this.deliveryQueue,
      deliveryConfig: this.deliveryConfig,
      monitorLastId: this.monitorLastId,
    });
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
    this.save();
    return channel;
  }

  ensureChannel(username: string, title: string): Channel {
    const clean = username.replace(/^@/, "").replace(/^https:\/\/t\.me\//, "").replace(/^t\.me\//, "");
    const url = `https://t.me/${clean}`;
    const existing = this.channels.find((c) => c.url.toLowerCase() === url.toLowerCase());
    if (existing) return existing;
    const channel: Channel = {
      id: "mc" + clean.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      title,
      url,
      postCount: 0,
      isActive: true,
      addedAt: new Date().toISOString(),
    };
    this.channels.push(channel);
    this.save();
    return channel;
  }

  hasMessage(channelId: string, messageId: number): boolean {
    return this.posts.some((p) => p.channelId === channelId && p.messageId === messageId);
  }

  getMonitorLastId(username: string): number | undefined {
    const v = this.monitorLastId[username];
    return v === undefined ? undefined : v;
  }

  setMonitorLastId(username: string, id: number): void {
    this.monitorLastId[username] = id;
    this.save();
  }

  setChannelActive(id: string, isActive: boolean): Channel | undefined {
    const ch = this.channels.find((c) => c.id === id);
    if (ch) ch.isActive = isActive;
    this.save();
    return ch;
  }

  deleteChannel(id: string): void {
    this.channels = this.channels.filter((c) => c.id !== id);
    this.posts = this.posts.filter((p) => p.channelId !== id);
    this.save();
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
    this.save();
    this.queueDeliveries(candidate);
    return { raw, parsed, status: "new", post: candidate };
  }

  simulateIncoming(): IncomingResult {
    const raw = rawSamples[Math.floor(Math.random() * rawSamples.length)];
    const activeChannels = this.channels.filter((c) => c.isActive);
    const channel = activeChannels[Math.floor(Math.random() * activeChannels.length)];
    return this.addIncoming(raw, channel);
  }

  addMonitoredPost(input: {
    channel: Channel;
    text: string;
    messageId: number;
    postedAt: string;
  }): IncomingResult | null {
    if (this.hasMessage(input.channel.id, input.messageId)) return null;
    const parsed = parsePost(input.text);
    const candidate: Post = {
      id: `p${this.seq++}`,
      channelId: input.channel.id,
      channelTitle: input.channel.title,
      channelUrl: input.channel.url,
      text: input.text,
      route: parsed.route,
      from: parsed.from!,
      to: parsed.to!,
      phone: parsed.phone,
      seats: parsed.people,
      postedAt: input.postedAt,
      messageId: input.messageId,
      alsoIn: [],
    };

    const dups = findDuplicates(candidate, this.posts, parsed.phone);
    if (dups.length > 0) {
      const target = dups[0];
      if (!target.alsoIn.some((s) => s.channelId === input.channel.id)) {
        target.alsoIn.push({ channelId: input.channel.id, channelTitle: input.channel.title });
      }
      return { raw: input.text, parsed, status: "duplicate", duplicatedFrom: target };
    }

    this.posts.unshift(candidate);
    this.enforceLimit(candidate.route);
    this.save();
    this.queueDeliveries(candidate);
    return { raw: input.text, parsed, status: "new", post: candidate };
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
    this.save();
  }

  getPostLimit(): number {
    return this.postLimit;
  }

  deletePost(id: string): boolean {
    const before = this.posts.length;
    this.posts = this.posts.filter((p) => p.id !== id);
    const ok = this.posts.length < before;
    this.save();
    return ok;
  }

  getUsers(): AppUser[] {
    return this.users;
  }

  setUserBlocked(id: string, blocked: boolean): AppUser | undefined {
    const u = this.users.find((x) => x.id === id);
    if (u) u.isBlocked = blocked;
    this.save();
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

  getConfig(isAdmin = false): AppConfig {
    return {
      cities: ["Toshkent", "Andijon", "Haqqulobod", "Namangan", "Farg'ona", "Qo'qon"],
      postLimit: this.postLimit,
      keywords: this.keywords,
      plans: demoPlans,
      isAdmin,
    };
  }

  addKeyword(kw: string): void {
    const k = kw.trim();
    if (k && !this.keywords.includes(k)) this.keywords.push(k);
    this.save();
  }

  removeKeyword(kw: string): void {
    this.keywords = this.keywords.filter((k) => k !== kw);
    this.save();
  }

  getKeywords(): string[] {
    return this.keywords;
  }

  getDeliveryTargets(): DeliveryTarget[] {
    return this.deliveryTargets;
  }

  addDeliveryTarget(input: DeliveryTargetInput): DeliveryTarget {
    const target: DeliveryTarget = {
      id: "t" + (this.deliveryTargets.length + 200),
      telegramId: Number(input.telegramId),
      channelUsername: String(input.channelUsername ?? "").trim().replace(/^@/, ""),
      channelTitle: String(input.channelTitle ?? input.channelUsername ?? "Kanal"),
      tier: input.tier ?? "regular",
      isActive: true,
      addedAt: new Date().toISOString(),
    };
    this.deliveryTargets.push(target);
    this.save();
    return target;
  }

  setDeliveryTarget(id: string, patch: Partial<DeliveryTarget>): DeliveryTarget | undefined {
    const t = this.deliveryTargets.find((x) => x.id === id);
    if (!t) return undefined;
    if (patch.channelUsername !== undefined) t.channelUsername = patch.channelUsername.trim().replace(/^@/, "");
    if (patch.channelTitle !== undefined) t.channelTitle = patch.channelTitle;
    if (patch.tier !== undefined) t.tier = patch.tier;
    if (patch.isActive !== undefined) t.isActive = Boolean(patch.isActive);
    this.save();
    return t;
  }

  deleteDeliveryTarget(id: string): void {
    this.deliveryTargets = this.deliveryTargets.filter((x) => x.id !== id);
    this.save();
  }

  getDeliveryConfig(): DeliveryConfig {
    return { ...this.deliveryConfig };
  }

  setDeliveryConfig(patch: Partial<DeliveryConfig>): DeliveryConfig {
    if (typeof patch.vipDelayMin === "number") {
      this.deliveryConfig.vipDelayMin = Math.max(1, Math.min(60, Math.floor(patch.vipDelayMin)));
    }
    if (typeof patch.regularDelayMin === "number") {
      this.deliveryConfig.regularDelayMin = Math.max(1, Math.min(60, Math.floor(patch.regularDelayMin)));
    }
    if (typeof patch.priorityDelaySec === "number") {
      this.deliveryConfig.priorityDelaySec = Math.max(0, Math.min(300, Math.floor(patch.priorityDelaySec)));
    }
    this.save();
    return { ...this.deliveryConfig };
  }

  queueDeliveries(post: Post): DeliveryTask[] {
    const tasks: DeliveryTask[] = [];
    const now = Date.now();
    for (const t of this.deliveryTargets) {
      if (!t.isActive || !t.channelUsername) continue;
      let delayMs = 0;
      if (t.tier === "vip") delayMs = this.deliveryConfig.vipDelayMin * 60_000;
      else if (t.tier === "regular") delayMs = this.deliveryConfig.regularDelayMin * 60_000;
      else delayMs = this.deliveryConfig.priorityDelaySec * 1000;
      tasks.push({
        id: "d" + ++this.dseq,
        postId: post.id,
        postRoute: post.route,
        postText: post.text,
        channelUsername: t.channelUsername,
        channelTitle: t.channelTitle,
        telegramId: t.telegramId,
        tier: t.tier,
        dueAt: new Date(now + delayMs).toISOString(),
        status: "pending",
        attempts: 0,
      });
    }
    if (tasks.length > 0) {
      this.deliveryQueue = [...tasks, ...this.deliveryQueue];
      this.save();
    }
    return tasks;
  }

  getDeliveryTasks(limit = 50): DeliveryTask[] {
    return this.deliveryQueue.slice(0, limit);
  }

  markTaskResult(id: string, ok: boolean, error?: string): void {
    const t = this.deliveryQueue.find((x) => x.id === id);
    if (!t) return;
    t.attempts++;
    if (ok) {
      t.status = "sent";
      t.sentAt = new Date().toISOString();
      t.error = undefined;
    } else {
      t.status = t.attempts >= 3 ? "failed" : "pending";
      t.error = error;
      if (t.status === "pending") {
        t.dueAt = new Date(Date.now() + 60_000).toISOString();
      }
    }
    this.save();
  }

  forceSendTask(id: string): DeliveryTask | undefined {
    const t = this.deliveryQueue.find((x) => x.id === id);
    if (!t) return undefined;
    t.dueAt = new Date().toISOString();
    t.status = "pending";
    this.save();
    return t;
  }

  clearFinishedTasks(): void {
    this.deliveryQueue = this.deliveryQueue.filter((x) => x.status === "pending");
    this.save();
  }
}

export const store = new Store();
