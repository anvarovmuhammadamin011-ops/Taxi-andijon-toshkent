import type { Post, User, UserSettings, UserNotification, RouteId } from './types';

// Local-only data layer. Mirrors the backend API using localStorage.
// No real backend needed - everything is stored in the browser.

const DB_KEY = 'taxi_local_db_v1';

interface LocalUser {
  id: string;
  name: string;
  telegramId: number;
  login: string;
  password: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked' | 'expired';
  monthlyPrice: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

interface LocalChannel {
  id: string;
  username: string;
  title: string;
  url: string;
  status: 'active' | 'inactive';
  totalPassengerPosts: number;
}

interface LocalDb {
  users: LocalUser[];
  posts: Post[];
  channels: LocalChannel[];
  saved: { userId: string; postId: string; savedAt: string }[];
  notifications: UserNotification[];
}

function seedDb(): LocalDb {
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  const testTexts = [
    { text: 'Тошкентга юрамиз 2та кам машина kerak', route: 'toshkent_andijon' as RouteId, phone: '998218408' },
    { text: 'Andijonga ketmoqchiman, 3 kishi, mashina kerak', route: 'andijon_toshkent' as RouteId, phone: '901234567' },
    { text: 'Тошкентдан Баликчига юрамиз 2 та одамимиз кам', route: 'toshkent_andijon' as RouteId, phone: '998765432' },
  ];

  const posts: Post[] = testTexts.map((p, i) => ({
    id: `local-post-${i}`,
    messageId: 1000 + i,
    channelId: 'ch-taxsislar',
    channelTitle: 'Taksilar',
    channelUrl: 'https://t.me/taxsislar',
    originalText: p.text,
    route: p.route,
    passengerCount: 2,
    phone: p.phone,
    username: null,
    classification: 'passenger',
    confidence: 0.9,
    isDuplicate: false,
    messageDate: now.toISOString(),
    collectedAt: now.toISOString(),
  }));

  return {
    users: [
      {
        id: 'local-user-test',
        name: 'Test User',
        telegramId: 8877452838,
        login: 'test',
        password: 'test123',
        role: 'user',
        status: 'active',
        monthlyPrice: 50000,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: end.toISOString(),
        settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'local-user-admin',
        name: 'Admin',
        telegramId: 0,
        login: 'admin',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        monthlyPrice: 0,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: end.toISOString(),
        settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ],
    posts,
    channels: [
      {
        id: 'ch-taxsislar',
        username: 'taxsislar',
        title: 'Taksilar',
        url: 'https://t.me/taxsislar',
        status: 'active',
        totalPassengerPosts: 3,
      },
    ],
    saved: [],
    notifications: [],
  };
}

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as LocalDb;
  } catch {
    /* ignore corrupted storage */
  }
  const db = seedDb();
  saveDb(db);
  return db;
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function makeToken(userId: string): string {
  return `local_${userId}_${Date.now()}`;
}

function parseToken(token: string | null | undefined): string | null {
  if (!token || !token.startsWith('local_')) return null;
  return token.split('_')[1] || null;
}

function publicUser(u: LocalUser) {
  return {
    id: u.id,
    name: u.name,
    telegramId: u.telegramId,
    login: u.login,
    role: u.role,
    status: u.status,
    monthlyPrice: u.monthlyPrice,
    subscriptionStart: u.subscriptionStart,
    subscriptionEnd: u.subscriptionEnd,
    settings: u.settings,
  };
}

function ok(data: unknown) {
  return { ok: true, data };
}

function fail(status: number, error: string) {
  return { status, ok: false, error };
}

function requireUser(db: LocalDb, reqHeaders: Record<string, string>): LocalUser | { error: { ok: boolean; status: number; error?: string } } {
  const auth = reqHeaders['authorization'] || reqHeaders['Authorization'] || '';
  const token = auth.replace('Bearer ', '');
  const userId = parseToken(token);
  const user = userId ? db.users.find((u) => u.id === userId) : undefined;
  if (!user) {
    return { error: { ok: false, status: 401, error: 'Unauthorized' } };
  }
  return user;
}

export async function localRequest(path: string, options: RequestInit = {}): Promise<{ ok: boolean; status?: number; data?: unknown; error?: string }> {
  const db = loadDb();
  const method = (options.method || 'GET').toUpperCase();
  const headers = (options.headers || {}) as Record<string, string>;
  let body: Record<string, unknown> = {};
  if (options.body) {
    try {
      body = JSON.parse(options.body as string);
    } catch {
      body = {};
    }
  }

  const segments = path.split('/').filter(Boolean); // e.g. ['api','me','saved','x','toggle']
  const resource = segments[1]; // auth | me | posts | admin
  const sub = segments[2];

  // ---- AUTH ----
  if (resource === 'auth' && sub === 'login' && method === 'POST') {
    const { login, password } = body as { login?: string; password?: string };
    const user = db.users.find((u) => u.login === login);
    if (!user || user.password !== password) return fail(401, 'Login yoki parol noto\u2019g\u2019ri');
    if (user.status === 'blocked') return fail(403, 'Akkauntingiz vaqtincha bloklangan');
    const now = Date.now();
    if (now > new Date(user.subscriptionEnd).getTime() && user.role !== 'admin') {
      return fail(403, 'Obuna muddati tugagan');
    }
    return ok({ token: makeToken(user.id), user: publicUser(user) });
  }

  const authResult = requireUser(db, headers);
  if ('error' in authResult) return authResult.error;
  const currentUser = authResult as LocalUser;
  // ---- POSTS ----
  if (resource === 'posts' && method === 'GET') {
    return ok(db.posts.filter((p) => p.classification === 'passenger' && !p.isDuplicate));
  }

  // ---- ME ----
  if (resource === 'me') {
    if (method === 'GET') {
      const savedIds = db.saved
        .filter((s) => s.userId === currentUser.id)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .map((s) => s.postId);
      const savedPosts = savedIds
        .map((id) => db.posts.find((p) => p.id === id && p.classification === 'passenger' && !p.isDuplicate))
        .filter((p): p is Post => !!p);
      const notifications = db.notifications
        .filter((n) => n.userId === currentUser.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const unread = notifications.filter((n) => !n.read).length;
      return ok({ user: publicUser(currentUser), savedPosts, savedCount: savedPosts.length, notifications, unreadNotifications: unread });
    }

    if (sub === 'settings' && method === 'PATCH') {
      const current = currentUser.settings;
      const next: UserSettings = {
        darkMode: typeof body.darkMode === 'boolean' ? body.darkMode : current.darkMode,
        notifications: typeof body.notifications === 'boolean' ? body.notifications : current.notifications,
        defaultRoute: ['toshkent_andijon', 'andijon_toshkent'].includes(body.defaultRoute as string)
          ? (body.defaultRoute as RouteId)
          : current.defaultRoute,
        language: body.language === 'ru' ? 'ru' : current.language === 'ru' ? current.language : 'uz',
      };
      currentUser.settings = next;
      currentUser.updatedAt = new Date().toISOString();
      saveDb(db);
      return ok({ settings: next });
    }

    if (sub === 'saved' && method === 'POST') {
      const postId = segments[3];
      const existing = db.saved.find((s) => s.userId === currentUser.id && s.postId === postId);
      if (existing) {
        db.saved = db.saved.filter((s) => s !== existing);
        saveDb(db);
        return ok({ saved: false });
      }
      db.saved.push({ userId: currentUser.id, postId, savedAt: new Date().toISOString() });
      saveDb(db);
      return ok({ saved: true });
    }

    if (sub === 'notifications') {
      if (method === 'POST' && segments[3] === 'read') {
        db.notifications = db.notifications.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n));
        saveDb(db);
        return ok({});
      }
      if (method === 'DELETE') {
        db.notifications = db.notifications.filter((n) => n.userId !== currentUser.id);
        saveDb(db);
        return ok({});
      }
      if (method === 'GET') {
        return ok(db.notifications.filter((n) => n.userId === currentUser.id));
      }
    }
  }

  // ---- ADMIN ----
  if (resource === 'admin') {
    if (currentUser.role !== 'admin') return fail(403, 'Forbidden');

    if (sub === 'stats' && method === 'GET') {
      const today = new Date().toDateString();
      const passengerToday = db.posts.filter((p) => p.classification === 'passenger' && !p.isDuplicate && new Date(p.collectedAt).toDateString() === today).length;
      const driverToday = db.posts.filter((p) => p.classification === 'driver' && new Date(p.collectedAt).toDateString() === today).length;
      return ok({
        totalUsers: db.users.length,
        activeUsers: db.users.filter((u) => u.status === 'active').length,
        expiredUsers: db.users.filter((u) => u.status === 'expired').length,
        blockedUsers: db.users.filter((u) => u.status === 'blocked').length,
        activeChannels: db.channels.filter((c) => c.status === 'active').length,
        totalChannels: db.channels.length,
        currentPosts: db.posts.length,
        maxPosts: 65,
        passengerPostsToday: passengerToday,
        driverPostsToday: driverToday,
      });
    }

    if (sub === 'users') {
      if (method === 'GET') {
        return ok(db.users.map(publicUser));
      }
      if (method === 'POST') {
        const { name, login, password, telegramId, monthlyPrice, subscriptionMonths } = body as {
          name?: string; login?: string; password?: string; telegramId?: number; monthlyPrice?: number; subscriptionMonths?: number;
        };
        if (!name || !login || !password) return fail(400, 'Barcha maydonlarni to\u2018ldiring');
        if (db.users.some((u) => u.login === login)) return fail(400, 'Bu login allaqachon mavjud');
        const now = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + (subscriptionMonths || 1));
        const user: LocalUser = {
          id: `local-user-${Date.now()}`,
          name: name!,
          telegramId: telegramId || 0,
          login: login!,
          password: password!,
          role: 'user',
          status: 'active',
          monthlyPrice: monthlyPrice || 50000,
          subscriptionStart: now.toISOString(),
          subscriptionEnd: end.toISOString(),
          settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        db.users.push(user);
        saveDb(db);
        return ok(publicUser(user));
      }

      const userId = segments[3];
      const target = db.users.find((u) => u.id === userId);
      if (!target) return fail(404, 'User not found');

      if (method === 'POST' && segments[4] === 'extend') {
        const end = new Date(target.subscriptionEnd);
        end.setMonth(end.getMonth() + 1);
        target.subscriptionEnd = end.toISOString();
        target.status = 'active';
        target.updatedAt = new Date().toISOString();
        saveDb(db);
        return ok(publicUser(target));
      }
      if (method === 'POST' && segments[4] === 'block') {
        target.status = body.blocked ? 'blocked' : 'active';
        target.updatedAt = new Date().toISOString();
        saveDb(db);
        return ok(publicUser(target));
      }
      if (method === 'DELETE') {
        if (target.id === currentUser.id) return fail(400, 'O\u2018zingizni o\u2018chira olmaysiz');
        db.users = db.users.filter((u) => u.id !== userId);
        db.saved = db.saved.filter((s) => s.userId !== userId);
        db.notifications = db.notifications.filter((n) => n.userId !== userId);
        saveDb(db);
        return ok({});
      }
    }

    if (sub === 'channels') {
      if (method === 'GET') {
        return ok(db.channels);
      }
      if (method === 'POST') {
        const { username, title } = body as { username?: string; title?: string };
        if (!username) return fail(400, 'Username kiriting');
        const id = `ch-${username}`;
        db.channels.push({
          id,
          username: username!,
          title: title || username!,
          url: `https://t.me/${username}`,
          status: 'active',
          totalPassengerPosts: 0,
        });
        saveDb(db);
        return ok({});
      }

      const channelId = segments[3];
      const channel = db.channels.find((c) => c.id === channelId);
      if (!channel) return fail(404, 'Channel not found');

      if (method === 'PATCH') {
        channel.status = body.status === 'inactive' ? 'inactive' : 'active';
        saveDb(db);
        return ok(channel);
      }
      if (method === 'DELETE') {
        db.channels = db.channels.filter((c) => c.id !== channelId);
        saveDb(db);
        return ok({});
      }
    }
  }

  return fail(404, 'Not found');
}