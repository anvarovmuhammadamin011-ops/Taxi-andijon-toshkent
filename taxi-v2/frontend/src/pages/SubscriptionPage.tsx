import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isExpired = new Date(user.subscriptionEnd) < new Date();
  const start = new Date(user.subscriptionStart).toLocaleDateString('uz-UZ');
  const end = new Date(user.subscriptionEnd).toLocaleDateString('uz-UZ');
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || '@admin_username';

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg">Obuna</h1>
          <button onClick={() => navigate('/profile')} className="text-sm text-[var(--text-secondary)]">← Ortga</button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Plan card */}
        <div className="bg-[var(--accent)] text-white rounded-3xl p-6 shadow-lg">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">Premium obuna</p>
          <p className="text-3xl font-bold mt-2">
            {user.monthlyPrice.toLocaleString()} so'm <span className="text-base font-normal">/ oy</span>
          </p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span>Amal qiladi</span>
              <span>{start} — {end}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>Holat</span>
              <span>{isExpired ? 'Muddati tugagan' : 'Aktiv ✅'}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)]">
          <p className="font-medium text-sm mb-2">Nimalar kiradi:</p>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1.5">
            <li>✅ Barcha yo'nalishlardagi yangi yo'lovchilar</li>
            <li>✅ Real-time yangi e'lonlar (tezkor bildirish)</li>
            <li>✅ E'lonlarni saqlash</li>
            <li>✅ Kanallar bo'yicha filter</li>
          </ul>
        </div>

        {/* Actions */}
        {isExpired ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-[var(--red)]">🔒 Obunangiz tugagan</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Uzaytirish uchun <span className="font-medium">{adminUsername}</span> bilan bog'laning
            </p>
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] text-center">
            <p className="text-sm text-[var(--text)]">Obunani uzaytirish uchun:</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {adminUsername} bilan bog'laning — uzaytirilgach avtomatik aktiv bo'ladi
            </p>
          </div>
        )}
      </main>
    </div>
  );
}