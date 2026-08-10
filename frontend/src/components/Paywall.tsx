import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { clearAdminToken, setAdminToken } from "../lib/adminAuth";

export default function Paywall({ message }: { message: string }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdmin(e: FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError("");
    const login = await api.admin.login(password.trim());
    if (!login.ok || !login.data?.token) {
      setError("Parol noto'g'ri");
      setBusy(false);
      return;
    }
    setAdminToken(login.data.token);
    await api.admin.setPaywall({ enabled: false });
    clearAdminToken();
    window.location.reload();
  }

  return (
    <div className="app-glow mx-auto flex h-full max-w-md flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="animate-fade-in-up flex flex-col items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-card-hi text-4xl">
          💰
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-wide text-ink">
          PULINI <span className="text-primary">TO'LANG</span>
        </h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-text-2">
          {message}
        </p>
        <div className="mt-8 w-full max-w-xs rounded-xl2 border border-line bg-card p-4 text-left shadow-soft">
          <p className="text-[13px] font-bold text-ink">To'lov uchun:</p>
          <p className="mt-1 text-[13px] text-text-2">
            Administrator bilan bog'laning —{" "}
            <span className="font-semibold text-ink">@ilyosakataxibot</span>
          </p>
        </div>
      </div>

      {!showAdmin ? (
        <button
          onClick={() => setShowAdmin(true)}
          className="mt-10 text-xs font-medium text-text-2 underline-offset-4 hover:underline"
        >
          Administrator
        </button>
      ) : (
        <form onSubmit={handleAdmin} className="mt-10 w-full max-w-xs space-y-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Administrator paroli"
            className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink outline-none focus:border-primary"
            autoFocus
          />
          {error && <p className="text-left text-xs font-medium text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Tekshirilmoqda..." : "Kirish"}
          </button>
        </form>
      )}
    </div>
  );
}
