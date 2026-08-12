import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES, routeLabel } from '../lib/types';

export default function RoutesPage() {
  const { user, updateSettings } = useAuth();
  const navigate = useNavigate();
  const defaultRoute = user?.settings?.defaultRoute || 'toshkent_andijon';
  const [selected, setSelected] = useState<string>(defaultRoute);

  const selectRoute = async (id: string) => {
    setSelected(id);
    await updateSettings({ defaultRoute: id as any });
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-3">
          <h1 className="font-bold text-lg">Yo'nalishlar</h1>
          <p className="text-xs text-[var(--text-secondary)]">Yo'nalish tanlang — yangi e'lonlar shular bo'yicha ko'rsatiladi</p>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {ROUTES.map((r) => {
          const isActive = selected === r.id;
          return (
            <button
              key={r.id}
              onClick={() => selectRoute(r.id)}
              className="w-full bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚕</span>
                <div className="text-left">
                  <p className="font-medium text-[var(--text)]">{r.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{routeLabel(r.id)} avtomatik filter</p>
                </div>
              </div>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isActive ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'
              }`}>
                {isActive && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </span>
            </button>
          );
        })}

        <div className="bg-[var(--card)] rounded-2xl p-4 border border-dashed border-[var(--border)] opacity-60">
          <p className="text-sm font-medium text-[var(--text)]">Keyinchalik:</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Toshkent → Samarqand · Andijon → Farg'ona ...
          </p>
        </div>
      </main>
    </div>
  );
}