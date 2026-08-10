import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { getAdminToken, setAdminToken } from "../lib/adminAuth";
import { telegram } from "../lib/telegram";
import { PlusIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddChannelSheet({ open, onClose, onAdded }: Props) {
  const { show } = useToast();
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));
  const [password, setPassword] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    if (!password.trim()) return;
    setBusy(true);
    const r = await api.admin.login(password.trim());
    setBusy(false);
    if (r.ok && r.data) {
      setAdminToken(r.data.token);
      setAuthed(true);
      setPassword("");
      telegram.haptic("light");
      show("Admin rejimi yoqildi", "🔓");
    } else {
      telegram.notify("error");
      show(r.error === "Parol noto'g'ri" ? "Parol noto'g'ri" : "Kirish muvaffaqiyatsiz", "❌");
    }
  };

  const submit = async () => {
    if (!link.trim()) {
      telegram.notify("warning");
      return;
    }
    setBusy(true);
    const r = await api.addChannel(link.trim());
    setBusy(false);
    if (r.ok && r.data) {
      telegram.haptic("light");
      telegram.notify("success");
      show(`"${r.data.title}" kanali qo'shildi`, "✅");
      setLink("");
      onAdded();
      onClose();
    } else if (r.status === 403) {
      setAuthed(false);
      show("Avval admin parolini kiriting", "🔒");
    } else {
      telegram.notify("error");
      show(r.error ?? "Qo'shib bo'lmadi", "⚠️");
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Kanal qo'shish">
      <div className="space-y-3 pb-4">
        {!authed ? (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin paroli"
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
            />
            <button
              onClick={login}
              disabled={busy}
              className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {busy ? "Tekshirilmoqda..." : "Kirish"}
            </button>
          </>
        ) : (
          <>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="t.me/kanal_nomi yoki @kanal_nomi"
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
            />
            <p className="text-[12px] leading-relaxed text-text-2">
              Telegram kanali havolasini joylang. Qo'shilgach, uning yangi e'lonlari avtomatik yig'iladi.
            </p>
            <button
              onClick={submit}
              disabled={busy}
              className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              {busy ? "Qo'shilmoqda..." : "Kanalni qo'shish"}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
