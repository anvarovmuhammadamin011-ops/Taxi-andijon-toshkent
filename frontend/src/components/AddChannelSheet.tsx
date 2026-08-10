import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { telegram } from "../lib/telegram";
import { PlusIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddChannelSheet({ open, onClose, onAdded }: Props) {
  const { show } = useToast();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

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
    } else {
      telegram.notify("error");
      show(r.error ?? "Qo'shib bo'lmadi", "⚠️");
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Kanal qo'shish">
      <div className="space-y-3 pb-4">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="t.me/kanal_nomi yoki @kanal_nomi"
          className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
        />
        <p className="text-[12px] leading-relaxed text-text-2">
          Telegram kanali havolasini joylang. Qo'shilgan kanal va uning e'lonlari faqat sizga ko'rinadi.
        </p>
        <button
          onClick={submit}
          disabled={busy}
          className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          {busy ? "Qo'shilmoqda..." : "Kanalni qo'shish"}
        </button>
      </div>
    </BottomSheet>
  );
}
