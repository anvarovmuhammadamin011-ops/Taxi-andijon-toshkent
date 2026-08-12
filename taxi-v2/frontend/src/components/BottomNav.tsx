import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { path: '/', label: 'Bosh', icon: '🏠' },
  { path: '/routes', label: 'Yo\u2018nalish', icon: '🗺️' },
  { path: '/saved', label: 'Saqlangan', icon: '❤️' },
  { path: '/notifications', label: 'Bildirish', icon: '🔔' },
  { path: '/profile', label: 'Profil', icon: '👤' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotifications } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] z-20">
      <div className="max-w-lg mx-auto grid grid-cols-5">
        {TABS.map((tab, i) => {
          const active = isActive(tab.path);
          return (
            <button
              key={i}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2.5 gap-0.5 relative ${
                active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.path === '/notifications' && unreadNotifications > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-3 min-w-4 h-4 px-1 bg-[var(--red)] text-white text-[9px] rounded-full flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}