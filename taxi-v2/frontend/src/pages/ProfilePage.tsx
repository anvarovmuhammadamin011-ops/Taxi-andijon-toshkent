import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routeLabel } from '../lib/types';

export default function ProfilePage() {
  const { user, logout, savedPosts, unreadNotifications } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isExpired = new Date(user.subscriptionEnd) < new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(user.subscriptionEnd).getTime() - Date.now()) / 86400000));

  const menuItems = [
    { label: 'Obuna', desc: `${user.monthlyPrice.toLocaleString()} so'm / oy`, icon: '💳', to: '/profile/subscription' },
    { label: 'Sozlamalar', desc: 'Ko`rinish, bildirishnomalar, til', icon: '⚙️', to: '/profile/settings' },
    { label: 'Saqlanganlar', desc: `${savedPosts.length} ta e\u2019lon`, icon: '❤️', to: '/saved' },
    { label: 'Bildirishnomalar', desc: unreadNotifications > 0 ? `${unreadNotifications} ta yangi` : 'Hammasi o`qildi', icon: '🔔', to: '/notifications' },
  ];

  if (user.role === 'admin') {
    menuItems.unshift({ label: 'Admin panel', desc: 'Dashboard, foydalanuvchilar, kanallar', icon: '👨\u200d💼', to: '/admin' });
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-[var(--text)] truncate">{user.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">@{user.login}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Asosiy yo'nalish: {routeLabel(user.settings?.defaultRoute || 'toshkent_andijon')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Subscription status */}
      <div className="px-4 mt-4">
        <div className={`rounded-2xl p-4 border ${
          isExpired ? 'bg-red-50 border-red-200' : 'bg-[var(--card)] border-[var(--border)]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {isExpired ? '🔒 Obunangiz tugagan' : '📅 Obuna aktiv'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isExpired
                  ? 'Pastdagi tugma orqali uzaytirish mumkin'
                  : `Tugashiga ${daysLeft} kun`}
              </p>
            </div>
            <button
              onClick={() => navigate('/profile/subscription')}
              className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-medium rounded-xl"
            >
              Batafsil
            </button>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="w-full bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] flex items-center gap-3 shadow-sm"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-[var(--text)]">{item.label}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.desc}</p>
            </div>
            <span className="text-[var(--text-secondary)]">›</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 mt-4 pb-4">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] text-[var(--red)] font-medium flex items-center justify-center gap-2 shadow-sm"
        >
          🚪 Chiqish
        </button>
        <p className="text-center text-[10px] text-[var(--text-secondary)] mt-3">
          Yordam uchun: @admin_username
        </p>
      </div>
    </div>
  );
}