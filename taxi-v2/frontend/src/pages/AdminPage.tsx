import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostsContext';
import { apiAdmin } from '../lib/api';
import * as localAuth from '../lib/localAuth';
import * as adminStore from '../lib/adminStore';
import { Post, User, routeLabel } from '../lib/types';

type Tab = 'dashboard' | 'users' | 'channels' | 'posts' | 'classifier' | 'subscriptions' | 'revenue' | 'routes' | 'notifications' | 'settings' | 'system';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Foydalanuvchilar', icon: '👥' },
  { id: 'channels', label: 'Kanallar', icon: '📢' },
  { id: 'posts', label: 'Postlar', icon: '📝' },
  { id: 'classifier', label: 'Classifier', icon: '🧠' },
  { id: 'subscriptions', label: 'Obunalar', icon: '💳' },
  { id: 'revenue', label: 'Daromad', icon: '💰' },
  { id: 'routes', label: 'Yo‘nalishlar', icon: '🗺️' },
  { id: 'notifications', label: 'Xabarnomalar', icon: '🔔' },
  { id: 'settings', label: 'Sozlamalar', icon: '⚙️' },
  { id: 'system', label: 'System Status', icon: '📡' },
];

// Admin-managed posts: fetched from the backend and kept in sync.
function useAdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  const load = () => {
    apiAdmin<Post[]>('/api/posts/all')
      .then((res) => {
        if (res.ok) setPosts(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const removePost = async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiAdmin(`/api/posts/${id}`, { method: 'DELETE' });
    } catch {
      /* ignore */
    }
  };

  const reclassify = async (id: string, classification: 'passenger' | 'driver' | 'unknown') => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, classification } : p)));
    try {
      await apiAdmin(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify({ classification }) });
    } catch {
      /* ignore */
    }
  };

  return { posts, removePost, reclassify, refresh: load };
}

// Admin-managed channels: fetched from backend.
interface AdminChannel {
  id: string;
  username: string;
  title: string;
  status: string;
}

function useAdminChannels() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);

  const load = () => {
    apiAdmin<AdminChannel[]>('/api/channels')
      .then((res) => {
        if (res.ok) setChannels(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const addChannel = async (username: string, title: string) => {
    try {
      await apiAdmin('/api/channels', { method: 'POST', body: JSON.stringify({ username, title }) });
    } catch {
      /* ignore */
    }
    load();
  };

  const deleteChannel = async (id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiAdmin(`/api/channels/${id}`, { method: 'DELETE' });
    } catch {
      /* ignore */
    }
  };

  const toggleChannel = async (id: string, active: boolean) => {
    try {
      await apiAdmin(`/api/channels/${id}`, { method: 'PATCH', body: JSON.stringify({ status: active ? 'active' : 'inactive' }) });
    } catch {
      /* ignore */
    }
    load();
  };

  return { channels, addChannel, deleteChannel, toggleChannel, refresh: load };
}

export default function AdminPage() {
  const { user } = useAuth();
  const { botConfigured } = usePosts();
  const { posts, removePost, reclassify, refresh: refreshPosts } = useAdminPosts();
  const { channels, addChannel, deleteChannel, toggleChannel, refresh: refreshChannels } = useAdminChannels();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const refresh = () => {
    setRefreshKey((k) => k + 1);
    refreshPosts();
    refreshChannels();
  };

  const users = useMemo<User[]>(() => localAuth.getAllUsers(), [refreshKey]);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = users.filter((u) => u.status === 'active' && new Date(u.subscriptionEnd).getTime() > now).length;
    const expired = users.filter((u) => u.status !== 'blocked' && new Date(u.subscriptionEnd).getTime() <= now).length;
    const blocked = users.filter((u) => u.status === 'blocked').length;
    const passenger = posts.filter((p) => p.classification === 'passenger').length;
    const driver = posts.filter((p) => p.classification === 'driver').length;
    const unknown = posts.filter((p) => p.classification === 'unknown').length;
    const lastPost = posts.length ? Math.max(...posts.map((p) => new Date(p.collectedAt).getTime())) : 0;
    return { totalUsers: users.length, activeUsers: active, expiredUsers: expired, blockedUsers: blocked, channels: channels.length, posts: posts.length, passenger, driver, unknown, lastPost };
  }, [users, posts, channels]);

  const revenue = useMemo(() => {
    const day = 86400000;
    const now = Date.now();
    const sum = (pred: (u: User) => boolean) => users.filter(pred).reduce((a, u) => a + u.monthlyPrice, 0);
    const startedToday = (u: User) => now - new Date(u.subscriptionStart).getTime() < day;
    const startedWeek = (u: User) => now - new Date(u.subscriptionStart).getTime() < day * 7;
    const startedMonth = (u: User) => now - new Date(u.subscriptionStart).getTime() < day * 30;
    return {
      today: sum(startedToday),
      week: sum(startedWeek),
      month: sum(startedMonth),
      total: users.reduce((a, u) => a + u.monthlyPrice, 0),
    };
  }, [users]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-60 md:flex-col bg-[var(--card)] border-r border-[var(--border)] p-3 sticky top-0 h-screen">
        <div className="font-bold text-lg mb-4 px-2">👨‍💼 Admin</div>
        <nav className="flex flex-col gap-1 overflow-y-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left ${
                tab === t.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg)]'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => navigate('/profile')} className="mt-auto px-3 py-2 text-sm text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg)]">
          ← Ortga
        </button>
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden bg-[var(--card)] border-b border-[var(--border)] px-2 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium ${
                tab === t.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)] text-[var(--text-secondary)]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {tab === 'dashboard' && <Dashboard stats={stats} revenue={revenue} botConfigured={botConfigured} />}
        {tab === 'users' && <UsersTab users={users} refresh={refresh} />}
        {tab === 'channels' && <ChannelsTab channels={channels} onAdd={addChannel} onDelete={deleteChannel} onToggle={toggleChannel} />}
        {tab === 'posts' && <PostsTab posts={posts} onRemove={removePost} />}
        {tab === 'classifier' && <ClassifierTab posts={posts} onReclassify={reclassify} />}
        {tab === 'subscriptions' && <SubscriptionsTab users={users} refresh={refresh} />}
        {tab === 'revenue' && <RevenueTab revenue={revenue} users={users} />}
        {tab === 'routes' && <RoutesTab refresh={refresh} />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'settings' && <SettingsTab refresh={refresh} />}
        {tab === 'system' && <SystemTab stats={stats} botConfigured={botConfigured} />}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
      <span className="text-xl">{icon}</span>
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

function Dashboard({ stats, revenue, botConfigured }: { stats: any; revenue: any; botConfigured: boolean }) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">📊 Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Foydalanuvchilar" value={stats.totalUsers} icon="👥" />
        <StatCard label="Aktiv" value={stats.activeUsers} icon="🟢" />
        <StatCard label="Muddati tugagan" value={stats.expiredUsers} icon="🔴" />
        <StatCard label="Bloklangan" value={stats.blockedUsers} icon="⛔" />
        <StatCard label="Kanallar" value={stats.channels} icon="📢" />
        <StatCard label="Aktiv postlar" value={`${stats.posts}/65`} icon="📝" />
        <StatCard label="Yo'lovchilar" value={stats.passenger} icon="👤" />
        <StatCard label="Haydovchilar" value={stats.driver} icon="🚕" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)]">💰 Bugungi tushum</p>
          <p className="text-lg font-bold">{revenue.today.toLocaleString()} so'm</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)]">💰 Oylik tushum</p>
          <p className="text-lg font-bold">{revenue.month.toLocaleString()} so'm</p>
        </div>
      </div>
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] text-xs text-[var(--text-secondary)]">
        {botConfigured ? '🟢 Bot ulangan — forward qilingan postlar yig\'ilmoqda' : '⚪ Demo rejim (VITE_TELEGRAM_BOT_TOKEN o\'rnatilmagan)'}
        {stats.lastPost ? ` · Oxirgi post: ${Math.max(0, Math.round((Date.now() - stats.lastPost) / 1000))} soniya oldin` : ''}
      </div>
    </div>
  );
}

function UsersTab({ users, refresh }: { users: User[]; refresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const extend = (id: string) => { localAuth.extendSubscription(id, 1); refresh(); };
  const block = (id: string, blocked: boolean) => { localAuth.setUserStatus(id, blocked ? 'blocked' : 'active'); refresh(); };
  const remove = (id: string) => { if (confirm('O\'chirilsinmi?')) { localAuth.deleteUser(id); refresh(); } };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">👥 Foydalanuvchilar ({users.length})</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 bg-[var(--accent)] text-white text-sm rounded-xl">+ Qo'shish</button>
      </div>
      {showAdd && <AddUserForm onDone={() => { setShowAdd(false); refresh(); }} />}
      {editing && <EditUserForm user={editing} onDone={() => { setEditing(null); refresh(); }} onClose={() => setEditing(null)} />}
      {users.map((u) => (
        <div key={u.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium truncate">{u.name} <span className="text-xs text-[var(--text-secondary)]">({u.role})</span></p>
              <p className="text-sm text-[var(--text-secondary)]">ID: {u.telegramId} · @{u.login}</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{u.status}</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Obuna: {new Date(u.subscriptionEnd).toLocaleDateString('uz-UZ')} · {u.monthlyPrice.toLocaleString()} so'm/oy</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => extend(u.id)} className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs rounded-lg">+ 1 oy</button>
            <button onClick={() => setEditing(u)} className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] text-xs rounded-lg">✏️ Tahrirlash</button>
            <button onClick={() => block(u.id, u.status !== 'blocked')} className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] text-xs rounded-lg">{u.status === 'blocked' ? 'Unblock' : 'Bloklash'}</button>
            <button onClick={() => remove(u.id)} className="px-3 py-1.5 bg-red-50 text-[var(--red)] text-xs rounded-lg">🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditUserForm({ user, onDone, onClose }: { user: User; onDone: () => void; onClose: () => void }) {
  const [price, setPrice] = useState(String(user.monthlyPrice));
  const [end, setEnd] = useState(user.subscriptionEnd.slice(0, 10));
  const [password, setPassword] = useState('');
  const save = () => {
    localAuth.updateUserAdmin(user.id, {
      monthlyPrice: Number(price) || user.monthlyPrice,
      subscriptionEnd: new Date(end).toISOString(),
      ...(password ? { password } : {}),
    });
    onDone();
  };
  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{user.name} — tahrirlash</p>
        <button onClick={onClose} className="text-xs text-[var(--text-secondary)]">✕</button>
      </div>
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Oylik narx" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Yangi parol (ixtiyoriy)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <button onClick={save} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">Saqlash</button>
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [price, setPrice] = useState('50000');
  const [months, setMonths] = useState('1');
  const [error, setError] = useState('');

  const submit = () => {
    const res = localAuth.addUserByAdmin({
      name, telegramId: Number(telegramId) || 0, login, password,
      monthlyPrice: Number(price) || 50000, subscriptionMonths: Number(months) || 1,
    });
    if (!res.ok) { setError(res.error || 'Xatolik'); return; }
    onDone();
  };

  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
      <p className="font-medium text-sm">Yangi foydalanuvchi</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Telegram ID" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Oylik narx" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={months} onChange={(e) => setMonths(e.target.value)} placeholder="Obuna (oy)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      <button onClick={submit} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">Yaratish</button>
    </div>
  );
}

function ChannelsTab({
  channels,
  onAdd,
  onDelete,
  onToggle,
}: {
  channels: AdminChannel[];
  onAdd: (username: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const submit = () => {
    if (!username) return;
    onAdd(username.replace(/^@/, ''), title || username);
    setUsername('');
    setTitle('');
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📢 Telegram Kanallar</h1>
      <p className="text-sm text-[var(--text-secondary)]">{channels.length} ta kanal</p>

      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
        <p className="font-medium text-sm">Yangi kanal qo'shish</p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (masalan: taxsislar)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nomi (ixtiyoriy)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <button onClick={submit} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">+ Qo'shish</button>
      </div>

      {channels.map((c) => {
        const active = c.status === 'active';
        return (
          <div key={c.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium truncate">@{c.username}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.title}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onToggle(c.id, active)} className={`px-3 py-1.5 text-xs rounded-lg ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {active ? '🟢 Active' : '⏸️ Paused'}
              </button>
              <button onClick={() => onDelete(c.id)} className="px-3 py-1.5 bg-red-50 text-[var(--red)] text-xs rounded-lg">🗑️</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PostsTab({ posts, onRemove }: { posts: Post[]; onRemove: (id: string) => void }) {
  const [filter, setFilter] = useState('all');
  const filtered = posts.filter((p) => filter === 'all' || p.classification === filter);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📝 Postlar ({posts.length})</h1>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['all', 'passenger', 'driver', 'unknown'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs ${filter === f ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] border border-[var(--border)]'}`}>{f}</button>
        ))}
      </div>
      {filtered.map((p) => (
        <div key={p.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2 py-1 rounded-full ${p.classification === 'passenger' ? 'bg-green-100 text-green-700' : p.classification === 'driver' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{p.classification}</span>
            <button onClick={() => onRemove(p.id)} className="text-xs text-[var(--red)]">🗑️</button>
          </div>
          <p className="text-sm mt-2 whitespace-pre-wrap">{p.originalText}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{routeLabel(p.route)} · {p.channelTitle}</p>
        </div>
      ))}
    </div>
  );
}

function ClassifierTab({ posts, onReclassify }: { posts: Post[]; onReclassify: (id: string, cls: 'passenger' | 'driver' | 'unknown') => void }) {
  const unknown = posts.filter((p) => p.classification === 'unknown');
  const counts = { passenger: posts.filter((p) => p.classification === 'passenger').length, driver: posts.filter((p) => p.classification === 'driver').length, unknown: unknown.length };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">🧠 Classifier nazorati</h1>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Passenger" value={counts.passenger} icon="🟢" />
        <StatCard label="Driver" value={counts.driver} icon="🔴" />
        <StatCard label="Unknown" value={counts.unknown} icon="🟡" />
      </div>
      <h2 className="font-medium">Unknown postlar</h2>
      {unknown.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Unknown postlar yo'q</p>}
      {unknown.map((p) => (
        <div key={p.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-sm whitespace-pre-wrap">{p.originalText}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => onReclassify(p.id, 'passenger')} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg">🟢 Passenger</button>
            <button onClick={() => onReclassify(p.id, 'driver')} className="px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg">🔴 Driver</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubscriptionsTab({ users, refresh }: { users: User[]; refresh: () => void }) {
  const now = Date.now();
  const rows = users.map((u) => {
    const end = new Date(u.subscriptionEnd).getTime();
    const days = Math.round((end - now) / 86400000);
    return { u, days, active: u.status === 'active' && end > now };
  });
  const extend = (id: string) => { localAuth.extendSubscription(id, 1); refresh(); };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">💳 Obunalar</h1>
      {rows.map(({ u, days, active }) => (
        <div key={u.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] flex items-center justify-between">
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-[var(--text-secondary)]">{active ? `Qoldi: ${days} kun` : '⛔ Muddati tugagan'}</p>
          </div>
          <button onClick={() => extend(u.id)} className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs rounded-lg">+ 1 oy</button>
        </div>
      ))}
    </div>
  );
}

function RevenueTab({ revenue, users }: { revenue: any; users: User[] }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">💰 Daromad</h1>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Bugun" value={revenue.today.toLocaleString()} icon="💰" />
        <StatCard label="7 kun" value={revenue.week.toLocaleString()} icon="💰" />
        <StatCard label="30 kun" value={revenue.month.toLocaleString()} icon="💰" />
        <StatCard label="Jami (oylik yig'indi)" value={revenue.total.toLocaleString()} icon="💰" />
      </div>
    </div>
  );
}

function RoutesTab({ refresh }: { refresh: () => void }) {
  const [routes, setRoutes] = useState(adminStore.getRoutes());
  const [label, setLabel] = useState('');
  const add = () => { if (label) { setRoutes(adminStore.addRoute(label)); setLabel(''); refresh(); } };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">🗺️ Yo'nalishlar</h1>
      {routes.map((r) => (
        <div key={r.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-2">
          <span>{r.icon}</span> <span className="font-medium">{r.label}</span>
        </div>
      ))}
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Yangi yo'nalish (masalan: Toshkent → Farg'ona)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <button onClick={add} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">Qo'shish</button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [list, setList] = useState(adminStore.getBroadcasts());
  const send = () => { if (title && message) { setList(adminStore.addBroadcast(title, message)); setTitle(''); setMessage(''); } };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">🔔 Xabarnomalar</h1>
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Xabar" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" rows={3} />
        <button onClick={send} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">Yuborish</button>
      </div>
      {list.map((b) => (
        <div key={b.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <p className="font-medium text-sm">{b.title}</p>
          <p className="text-sm text-[var(--text-secondary)]">{b.message}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ refresh }: { refresh: () => void }) {
  const [s, setS] = useState(adminStore.getAdminSettings());
  const [appName, setAppName] = useState(s.appName);
  const [support, setSupport] = useState(s.supportUsername);
  const [adminTg, setAdminTg] = useState(s.adminTelegram);
  const [price, setPrice] = useState(String(s.defaultPrice));
  const [maxPosts, setMaxPosts] = useState(String(s.maxPosts));
  const save = () => { adminStore.updateAdminSettings({ appName, supportUsername: support, adminTelegram: adminTg, defaultPrice: Number(price) || 50000, maxPosts: Number(maxPosts) || 65 }); refresh(); alert('Saqlandi'); };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">⚙️ Sozlamalar</h1>
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
        <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Ilova nomi" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <input value={support} onChange={(e) => setSupport(e.target.value)} placeholder="Support username" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <input value={adminTg} onChange={(e) => setAdminTg(e.target.value)} placeholder="Admin Telegram" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Default oylik narx" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <input value={maxPosts} onChange={(e) => setMaxPosts(e.target.value)} placeholder="Maksimal postlar" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
        <button onClick={save} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">Saqlash</button>
      </div>
    </div>
  );
}

function SystemTab({ stats, botConfigured }: { stats: any; botConfigured: boolean }) {
  const items = [
    { label: 'Telegram connection', ok: botConfigured },
    { label: 'Collector', ok: stats.posts >= 0 },
    { label: 'Frontend', ok: true },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📡 System Status</h1>
      {items.map((i) => (
        <div key={i.label} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] flex items-center justify-between">
          <span>{i.label}</span>
          <span className={i.ok ? 'text-green-600' : 'text-red-600'}>{i.ok ? '🟢' : '🔴'}</span>
        </div>
      ))}
      <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] text-xs text-[var(--text-secondary)]">
        {botConfigured ? '🟢 Bot ulangan' : '⚪ Bot token o\'rnatilmagan (demo rejim)'}
        {stats.lastPost ? ` · Oxirgi post: ${Math.round((Date.now() - stats.lastPost) / 1000)}s oldin` : ''}
      </div>
    </div>
  );
}
