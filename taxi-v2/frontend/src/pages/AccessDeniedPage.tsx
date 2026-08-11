export default function AccessDeniedPage() {
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || '@admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚫</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--text)] mb-2">Kirish taqiqlangan</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Siz ushbu ilovadan foydalanish huquqiga ega emassiz. Foydalanish uchun administrator bilan bog'laning.
        </p>
        <a
          href={`https://t.me/${adminUsername.replace('@', '')}`}
          className="inline-flex items-center gap-2 bg-[var(--blue)] text-white font-semibold px-6 py-3 rounded-xl"
        >
          Administrator bilan bog'lanish
        </a>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{adminUsername}</p>
      </div>
    </div>
  );
}
