import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routeLabel } from '../lib/types';

export default function NotificationsPage() {
  const { notifications, markNotificationsRead } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    markNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-3">
          <h1 className="font-bold text-lg">Bildirishnomalar</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Tanlangan yo'nalish bo'yicha yangi e'lonlar
          </p>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🔔</p>
            <p className="text-[var(--text-secondary)]">Bildirishnomalar yo'q</p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Yo'nalish tanlab, yangi e'lonlar haqida xabar oling</p>
            <button
              onClick={() => navigate('/routes')}
              className="mt-4 px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-xl"
            >
              Yo'nalish tanlash
            </button>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 border ${
                n.read
                  ? 'bg-[var(--card)] border-[var(--border)]'
                  : 'bg-[var(--accent)]/10 border-[var(--accent)]/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🔔</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-medium">
                      {routeLabel(n.route)}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {new Date(n.createdAt).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text)] mt-2 line-clamp-2">{n.text}</p>
                  {n.passengerCount && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">👥 {n.passengerCount} kishi</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}