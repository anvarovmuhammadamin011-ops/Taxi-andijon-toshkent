import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../lib/types';

export default function RoutesPage() {
  const { user, updateSettings } = useAuth();
  const defaultRoute = user?.settings?.defaultRoute || 'toshkent_andijon';
  const [selected, setSelected] = useState<string>(defaultRoute);

  const selectRoute = async (id: string) => {
    setSelected(id);
    await updateSettings({ defaultRoute: id as any });
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 pt-5 pb-3">
          <p className="text-sm text-[var(--text-secondary)]">Qayerga ketmoqchisiz?</p>
          <h1 className="text-2xl font-bold text-[var(--text)]">Yo’nalish</h1>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* Yo'nalish vizual tanlagich */}
        <div className="bg-[var(--card)] rounded-3xl p-5 border border-[var(--border)] flex flex-col items-center">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--bg)] flex items-center justify-center text-xl">📍</div>
              <p className="text-sm font-medium mt-1 text-[var(--text)]">Toshkent</p>
            </div>
            <span className="text-2xl text-[var(--accent)]">↓</span>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--bg)] flex items-center justify-center text-xl">📍</div>
              <p className="text-sm font-medium mt-1 text-[var(--text)]">Andijon</p>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-3 text-center">
            Tanlangan yo’nalish bo’yicha e’lonlar ko’rsatiladi
          </p>
        </div>

        {/* Mashhur yo'nalishlar */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)] px-1 mb-2">🔥 Mashhur yo’nalishlar</h2>
          <div className="space-y-2">
            {ROUTES.map((r) => {
              const isActive = selected === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => selectRoute(r.id)}
                  className="w-full bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] flex items-center justify-between"
                >
                  <span className="font-medium text-[var(--text)]">{r.label}</span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'
                    }`}
                  >
                    {isActive && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
