import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin, register: authRegister } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(login, password);
  };

  const doLogin = async (lg: string, pw: string) => {
    setError('');
    setLoading(true);
    const result = mode === 'login'
      ? await authLogin(lg, pw)
      : await authRegister(name, lg, pw);
    setLoading(false);
    if (result.ok) {
      navigate(result.user?.role === 'admin' ? '/admin' : '/');
    } else {
      setError(result.error || (mode === 'login' ? "Login yoki parol noto'g'ri" : "Ro'yxatdan o'tishda xatolik"));
    }
  };

  const quickAdmin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authLogin('admin', 'admin');
      if (res.ok) {
        navigate(res.user?.role === 'admin' ? '/admin' : '/');
      } else {
        setError('Admin kirishda xatolik: ' + (res.error || ''));
      }
    } catch (e: any) {
      console.error('quickAdmin error', e);
      setError('Xatolik: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚕</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Taxi Collector</h1>
          <p className="text-[var(--text-secondary)] mt-1">{mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-6 shadow-sm border border-[var(--border)]">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ism</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Ismingiz"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Login</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Login kiriting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Parol kiriting"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[var(--accent)] text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Yuklanmoqda...' : (mode === 'login' ? 'KIRISH' : "Ro'yxatdan o'tish")}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full mt-3 text-sm text-[var(--text-secondary)]"
        >
          {mode === 'login' ? "Akkaunt yo'qmi? Ro'yxatdan o'ting" : 'Akkauntingiz bormi? Kirish'}
        </button>

        <button
          onClick={quickAdmin}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-[var(--accent)] text-white font-semibold py-3 rounded-xl"
        >
          👨‍💼 Admin panelga kirish (tez)
        </button>
        <p className="text-center text-xs text-[var(--text-secondary)] mt-2">login: admin · parol: admin</p>
      </div>
    </div>
  );
}
