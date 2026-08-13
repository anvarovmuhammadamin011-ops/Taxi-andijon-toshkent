import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routeLabel } from '../lib/types';
import { timeAgo } from '../lib/format';

export default function NotificationsPage() {
  const { notifications, markNotificationsRead } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    markNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-2xl font-bold text-[var(--text)]">Bildirishnomalar</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real-time yangi yo’lovchilar</p>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🔔</p>
            <p className="text-[var(--text-secondary)]">Hozircha yangi yo’lovchi yo’q</p>
            <button
              onClick={() => navigate('/routes')}
              className="mt-4 px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-xl"
            >
              Yo’nalish tanlash
            </button>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`rounded-2xl p-4 border ${n.read ? 'bg-[var(--card)] border-[var(--border)]' : 'bg-[var(--accent)]/10 border-[var(--accent)]/30'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-[var(--green)]/15 text-[var(--green)] px-2 py-0.5 rounded-lg font-medium">
                      Yangi yo’lovchi
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[var(--text)] mt-2 font-medium">{routeLabel(n.route)}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {n.passengerCount ? `${n.passengerCount} kishi` : 'Yo’lovchi'} · {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
