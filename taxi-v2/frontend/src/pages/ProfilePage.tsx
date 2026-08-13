import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout, savedPosts, unreadNotifications, updateSettings } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isExpired = new Date(user.subscriptionEnd) < new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(user.subscriptionEnd).getTime() - Date.now()) / 86400000));
  const dark = user.settings?.darkMode ?? false;

  const menuItems = [
    { label: 'Bildirishnomalar', desc: unreadNotifications > 0 ? `${unreadNotifications} ta yangi` : 'Hammasi o’qildi', icon: '🔔', action: () => navigate('/notifications') },
    {
      label: 'Ko’rinish',
      desc: dark ? 'Dark Mode yoqilgan' : 'Light Mode',
      icon: '🌙',
      action: () => updateSettings({ darkMode: !dark }),
      toggle: true,
      active: dark,
    },
    { label: 'Obuna', desc: isExpired ? 'Tugagan' : `${daysLeft} kun qoldi`, icon: '💳', action: () => navigate('/profile/subscription') },
    { label: 'Yordam', desc: 'Savollar va javoblar', icon: '❓', action: () => navigate('/profile/settings') },
  ];

  if (user.role === 'admin') {
    menuItems.unshift({ label: 'Admin panel', desc: 'Dashboard, foydalanuvchilar', icon: '👨‍💼', action: () => navigate('/admin') } as any);
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-[var(--text)] truncate">{user.name}</h1>
                <span className="text-[10px] font-semibold bg-[var(--accent)]/15 text-[var(--accent)] px-1.5 py-0.5 rounded-full">Premium</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">@{user.login}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Obuna holati */}
      <div className="px-4 mt-4">
        <div className={`rounded-2xl p-4 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-[var(--card)] border-[var(--border)]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-[var(--red)]' : 'bg-[var(--green)]'}`} />
                {isExpired ? 'Obuna tugagan' : 'Aktiv'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isExpired ? 'Uzaytirish kerak' : `Obuna: ${daysLeft} kun qoldi`}
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

      {/* Menyu */}
      <div className="px-4 mt-4 space-y-2">
        {menuItems.map((item: any) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] flex items-center gap-3"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-[var(--text)]">{item.label}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.desc}</p>
            </div>
            {item.toggle ? (
              <span className={`w-11 h-6 rounded-full flex items-center px-0.5 ${item.active ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'}`}>
                <span className="w-5 h-5 rounded-full bg-white" />
              </span>
            ) : (
              <span className="text-[var(--text-secondary)]">›</span>
            )}
          </button>
        ))}
      </div>

      {/* Chiqish */}
      <div className="px-4 mt-4 pb-4">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] text-[var(--red)] font-medium flex items-center justify-center gap-2"
        >
          🚪 Chiqish
        </button>
      </div>
    </div>
  );
}
