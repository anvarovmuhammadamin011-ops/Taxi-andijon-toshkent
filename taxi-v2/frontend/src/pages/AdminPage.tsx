import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  name: string;
  telegramId: number;
  login: string;
  status: string;
  monthlyPrice: number;
  subscriptionEnd: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  activeChannels: number;
  currentPosts: number;
  passengerPostsToday: number;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'dashboard' | 'users' | 'channels'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    if (tab === 'users') fetchUsers();
  }, [tab]);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) setStats(data.data);
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) setUsers(data.data);
  };

  const extendSubscription = async (userId: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/admin/users/${userId}/extend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg">Admin Panel</h1>
          <button onClick={() => navigate('/')} className="text-sm text-[var(--text-secondary)]">
            ← Ortga
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          {(['dashboard', 'users', 'channels'] as const).map((t) => (
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

        {/* Dashboard */}
        {tab === 'dashboard' && stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Jami foydalanuvchilar" value={stats.totalUsers} icon="👥" />
            <StatCard label="Aktiv foydalanuvchilar" value={stats.activeUsers} icon="🟢" />
            <StatCard label="Aktiv kanallar" value={stats.activeChannels} icon="📢" />
            <StatCard label="Joriy postlar" value={`${stats.currentPosts}/65`} icon="📝" />
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">ID: {u.telegramId}</p>
                  </div>
                  <button
                    onClick={() => extendSubscription(u.id)}
                    className="px-3 py-1.5 bg-[var(--accent)] text-white text-sm rounded-lg"
                  >
                    + 1 oy
                  </button>
                </div>
                <div className="mt-2 text-xs text-[var(--text-secondary)]">
                  Obuna: {new Date(u.subscriptionEnd).toLocaleDateString('uz-UZ')} | {u.monthlyPrice.toLocaleString()} so'm
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}
