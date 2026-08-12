import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../lib/types';

export default function SettingsPage() {
  const { user, updateSettings } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const s = user.settings || { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' };
  const [darkMode, setDarkMode] = useState(s.darkMode);
  const [notifications, setNotifications] = useState(s.notifications);
  const [language, setLanguage] = useState<'uz' | 'ru'>(s.language);
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || '@admin_username';

  const toggleDark = async (v: boolean) => {
    setDarkMode(v);
    await updateSettings({ darkMode: v });
  };

  const toggleNotif = async (v: boolean) => {
    setNotifications(v);
    await updateSettings({ notifications: v });
  };

  const changeLang = async (l: 'uz' | 'ru') => {
    setLanguage(l);
    await updateSettings({ language: l });
  };

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg">Sozlamalar</h1>
          <button onClick={() => navigate('/profile')} className="text-sm text-[var(--text-secondary)]">← Ortga</button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Appearance */}
        <Section title="Ko'rinish">
          <Row icon="🌙" label="Dark mode">
            <Toggle checked={darkMode} onChange={toggleDark} />
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Bildirishnomalar">
          <Row icon="🔔" label="Yangi e'lon bildirishlari" desc={notifications ? 'Yoqilgan' : 'O\'chirilgan'}>
            <Toggle checked={notifications} onChange={toggleNotif} />
          </Row>
        </Section>

        {/* Default route */}
        <Section title="Standart yo'nalish">
          <div className="space-y-2">
            {ROUTES.map((r) => (
              <button
                key={r.id}
                onClick={() => updateSettings({ defaultRoute: r.id as any })}
                className={`w-full px-3 py-2.5 rounded-xl text-sm flex items-center justify-between ${
                  s.defaultRoute === r.id
                    ? 'bg-[var(--accent)]/10 border border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--bg)] border border-[var(--border)] text-[var(--text)]'
                }`}
              >
                <span>{r.label}</span>
                {s.defaultRoute === r.id && <span>✓</span>}
              </button>
            ))}
          </div>
        </Section>

        {/* Language */}
        <Section title="Til">
          <Row icon="🌐" label="Til">
            <div className="flex gap-2">
              {(['uz', 'ru'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    language === l
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  {l === 'uz' ? 'O\'zbekcha' : 'Русский'}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Help */}
        <Section title="Yordam">
          <a
            href={`https://t.me/${adminUsername.replace('@', '')}`}
            className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] rounded-xl border border-[var(--border)]"
          >
            <span className="text-xl">📞</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[var(--text)]">Yordam / Admin</p>
              <p className="text-xs text-[var(--text-secondary)]">{adminUsername}</p>
            </div>
            <span className="text-[var(--text-secondary)]">›</span>
          </a>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide px-1 mb-2">{title}</p>
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">{children}</div>
    </div>
  );
}

function Row({ icon, label, desc, children }: { icon: string; label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-[var(--text)]">{label}</p>
          {desc && <p className="text-xs text-[var(--text-secondary)]">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}