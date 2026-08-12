import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  telegramId: number;
  login: string;
  status: string;
  role: string;
  monthlyPrice: number;
  subscriptionEnd: string;
}

interface Channel {
  id: string;
  username: string;
  title: string;
  url: string;
  status: string;
  totalPassengerPosts: number;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  blockedUsers: number;
  activeChannels: number;
  totalChannels: number;
  currentPosts: number;
  maxPosts: number;
  passengerPostsToday: number;
  driverPostsToday: number;
}

type Tab = 'dashboard' | 'users' | 'channels';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    const res = await api<Stats>('/api/admin/stats');
    if (res.ok) setStats(res.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await api<User[]>('/api/admin/users');
    if (res.ok) setUsers(res.data);
  }, []);

  const fetchChannels = useCallback(async () => {
    const res = await api<Channel[]>('/api/admin/channels');
    if (res.ok) setChannels(res.data);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'channels') fetchChannels();
  }, [tab, fetchUsers, fetchChannels]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg">👨\u200d💼 Admin Panel</h1>
          <button onClick={() => navigate('/profile')} className="text-sm text-[var(--text-secondary)]">← Ortga</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          {(['dashboard', 'users', 'channels'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                tab === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--text-secondary)]'
              }`}
            >
              {t === 'dashboard' ? 'Dashboard' : t === 'users' ? 'Foydalanuvchilar' : 'Kanallar'}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Jami foydalanuvchilar" value={stats.totalUsers} icon="👥" />
              <StatCard label="Aktiv" value={stats.activeUsers} icon="🟢" />
              <StatCard label="Muddati tugagan" value={stats.expiredUsers} icon="🔴" />
              <StatCard label="Bloklangan" value={stats.blockedUsers} icon="⛔" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Kanallar" value={`${stats.activeChannels}/${stats.totalChannels}`} icon="📢" />
              <StatCard label="Aktiv postlar" value={`${stats.currentPosts}/${stats.maxPosts}`} icon="📝" />
              <StatCard label="Yo'lovchilar bugun" value={stats.passengerPostsToday} icon="👤" />
              <StatCard label="Haydovchilar bugun" value={stats.driverPostsToday} icon="🚕" />
            </div>
          </div>
        )}

        {tab === 'users' && <UsersTab users={users} fetchUsers={fetchUsers} fetchStats={fetchStats} />}

        {tab === 'channels' && (
          <ChannelsTab
            channels={channels}
            fetchChannels={fetchChannels}
            showAdd={showAddChannel}
            setShowAdd={setShowAddChannel}
          />
        )}
      </div>
    </div>
  );
}

function UsersTab({ users, fetchUsers, fetchStats }: { users: User[]; fetchUsers: () => void; fetchStats: () => void }) {
  const [showAdd, setShowAdd] = useState(false);

  const extendSubscription = async (userId: string) => {
    await api(`/api/admin/users/${userId}/extend`, { method: 'POST', body: JSON.stringify({}) });
    fetchUsers();
    fetchStats();
  };

  const toggleBlock = async (userId: string, blocked: boolean) => {
    await api(`/api/admin/users/${userId}/block`, { method: 'POST', body: JSON.stringify({ blocked }) });
    fetchUsers();
    fetchStats();
  };

  const removeUser = async (userId: string) => {
    if (!confirm('Bu foydalanuvchini o`chirilsinmi?')) return;
    await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
    fetchUsers();
    fetchStats();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-xl">
          + User qo'shish
        </button>
      </div>

      {showAdd && <AddUserForm onDone={() => { setShowAdd(false); fetchUsers(); fetchStats(); }} />}

      {users.map((u) => (
        <div key={u.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium truncate">{u.name} <span className="text-xs text-[var(--text-secondary)]">({u.role})</span></p>
              <p className="text-sm text-[var(--text-secondary)]">ID: {u.telegramId} · @{u.login}</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
              u.status === 'active' ? 'bg-green-100 text-green-700'
              : u.status === 'blocked' ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600'
            }`}>
              {u.status}
            </span>
          </div>
          <div className="mt-2 text-xs text-[var(--text-secondary)]">
            Obuna: {new Date(u.subscriptionEnd).toLocaleDateString('uz-UZ')} | {u.monthlyPrice.toLocaleString()} so'm
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => extendSubscription(u.id)} className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs rounded-lg">
              + 1 oy
            </button>
            <button onClick={() => toggleBlock(u.id, u.status !== 'blocked')} className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] text-xs rounded-lg">
              {u.status === 'blocked' ? 'Unblock' : 'Bloklash'}
            </button>
            <button onClick={() => removeUser(u.id)} className="px-3 py-1.5 bg-red-50 text-[var(--red)] text-xs rounded-lg">
              🗑️ O'chirish
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('50000');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name || !login || !password || !telegramId) {
      setError('Barcha maydonlarni to`ldiring');
      return;
    }
    setBusy(true);
    setError('');
    const res = await api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name,
        login,
        password,
        telegramId: Number(telegramId),
        monthlyPrice: Number(monthlyPrice),
        subscriptionMonths: 1,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Xatolik');
      return;
    }
    onDone();
  };

  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
      <p className="font-medium text-sm">Yangi user</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" type="text" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Telegram ID" type="number" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      <input value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} placeholder="Oylik narx (so'm)" type="number" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
      {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      <button onClick={submit} disabled={busy} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
        {busy ? 'Saqlanmoqda...' : 'Qo`shish'}
      </button>
    </div>
  );
}

function ChannelsTab({ channels, fetchChannels, showAdd, setShowAdd }: {
  channels: Channel[];
  fetchChannels: () => void;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
}) {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const addChannel = async () => {
    if (!username) {
      setError('Username kiriting');
      return;
    }
    setError('');
    const res = await api('/api/admin/channels', {
      method: 'POST',
      body: JSON.stringify({ username: username.replace('@', ''), title: title || undefined }),
    });
    if (res.ok) {
      setUsername('');
      setTitle('');
      setShowAdd(false);
      fetchChannels();
    } else {
      setError(res.error || 'Xatolik');
    }
  };

  const toggleChannel = async (id: string, status: string) => {
    await api(`/api/admin/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status === 'active' ? 'inactive' : 'active' }),
    });
    fetchChannels();
  };

  const removeChannel = async (id: string) => {
    if (!confirm('Kanal o`chirilsinmi?')) return;
    await api(`/api/admin/channels/${id}`, { method: 'DELETE' });
    fetchChannels();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-xl">
          + Kanal qo'shish
        </button>
      </div>

      {showAdd && (
        <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] space-y-2">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Kanal username (t.me/username)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kanal nomi (ixtiyoriy)" className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm" />
          {error && <p className="text-xs text-[var(--red)]">{error}</p>}
          <button onClick={addChannel} className="w-full bg-[var(--accent)] text-white py-2 rounded-lg text-sm font-medium">
            Qo'shish
          </button>
        </div>
      )}

      {channels.map((c) => (
        <div key={c.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-medium truncate">{c.title}</p>
              <p className="text-sm text-[var(--text-secondary)]">@{c.username} · {c.totalPassengerPosts} post</p>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'active' ? 'bg-[var(--green)]' : 'bg-gray-300'}`} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => toggleChannel(c.id, c.status)} className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] text-xs rounded-lg">
              {c.status === 'active' ? 'To`xtatish' : 'Faollashtirish'}
            </button>
            <a href={c.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] text-xs rounded-lg">
              Ochish ↗
            </a>
            <button onClick={() => removeChannel(c.id)} className="px-3 py-1.5 bg-red-50 text-[var(--red)] text-xs rounded-lg">
              🗑️
            </button>
          </div>
        </div>
      ))}
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