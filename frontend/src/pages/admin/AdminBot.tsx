import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { AdminHeader, AdminRow } from "./AdminUi";
import { telegram } from "../../lib/telegram";
import { PlusIcon, TrashIcon } from "../../components/Icons";
import type { DeliveryConfig, DeliveryTarget, DeliveryTask } from "../../types";

const TIER_LABEL: Record<string, { label: string; chip: string }> = {
  priority: { label: "⚡ Prioritet", chip: "bg-primary/15 text-primary border-primary/30" },
  vip: { label: "👑 VIP", chip: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  regular: { label: "👤 Oddiy", chip: "bg-card-hi text-text-2 border-line" },
};

function relTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "hozir";
  const m = Math.floor(diff / 60000);
  if (m < 1) return `${Math.floor(diff / 1000)} soniya`;
  return `${m} daqiqa`;
}

function fmtTime(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminBot() {
  const [cfg, setCfg] = useState<DeliveryConfig>({ vipDelayMin: 5, regularDelayMin: 8, priorityDelaySec: 0 });
  const [targets, setTargets] = useState<DeliveryTarget[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);

  const [form, setForm] = useState({ telegramId: "", channelUsername: "", channelTitle: "", tier: "regular" });
  const [busyTarget, setBusyTarget] = useState("");

  const load = async () => {
    const [c, t, k] = await Promise.all([
      api.admin.deliveryConfig(),
      api.admin.deliveryTargets(),
      api.admin.deliveryTasks(),
    ]);
    if (c.ok && c.data) setCfg(c.data);
    if (t.ok) setTargets(t.data);
    if (k.ok) setTasks(k.data);
  };

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(), 8000);
    return () => clearInterval(iv);
  }, []);

  const saveCfg = () => {
    telegram.haptic("light");
    void api.admin.setDeliveryConfig(cfg).then((r) => r.ok && setCfg(r.data));
    telegram.notify("success");
  };

  const addTarget = () => {
    if (!form.telegramId.trim() || !form.channelUsername.trim()) return;
    telegram.haptic("light");
    void api.admin
      .addDeliveryTarget({
        telegramId: Number(form.telegramId),
        channelUsername: form.channelUsername.trim(),
        channelTitle: form.channelTitle.trim() || undefined,
        tier: form.tier,
      })
      .then((r) => {
        if (r.ok) {
          setForm({ telegramId: "", channelUsername: "", channelTitle: "", tier: "regular" });
          void load();
        }
      });
  };

  const toggleTarget = (t: DeliveryTarget) => {
    telegram.haptic("light");
    void api.admin.updateDeliveryTarget(t.id, { isActive: !t.isActive }).then((r) => r.ok && void load());
  };

  const removeTarget = (id: string) => {
    telegram.haptic("light");
    void api.admin.deleteDeliveryTarget(id).then(() => void load());
  };

  const testTarget = async (t: DeliveryTarget) => {
    setBusyTarget(t.id);
    const r = await api.admin.testDeliveryTarget(t.id);
    setBusyTarget("");
    telegram.notify(r.ok ? "success" : "warning");
  };

  const sendNow = (id: string) => {
    telegram.haptic("light");
    void api.admin.sendTaskNow(id).then(() => void load());
  };

  const clearFinished = () => {
    telegram.haptic("light");
    void api.admin.clearFinishedTasks().then(() => void load());
  };

  const statusChip = (s: DeliveryTask["status"]) =>
    s === "sent"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : s === "failed"
        ? "bg-red-500/15 text-red-400 border-red-500/30"
        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Bot & Tarqatish" subtitle="Postlarni kanallarga yuborish" />

        <div className="mt-4 space-y-3">
          <AdminRow title="🤖 Bot holati" subtitle="Bot token backend/.env faylida saqlanadi">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                cfg.hasToken
                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              }`}
            >
              {cfg.hasToken ? "✅ Bot token o'rnatilgan" : "❌ BOT_TOKEN backend/.env da yo'q"}
            </span>
            <p className="mt-2 text-xs text-text-2">
              Kanalga tashlash uchun bot o'sha kanalga <b>admin</b> qo'shilgan bo'lishi shart.
            </p>
          </AdminRow>

          <AdminRow title="⏱️ Kechikishlar" subtitle="Yangi post qancha vaqtdan keyin kanalga tashlanadi">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "priorityDelaySec", label: "⚡ Prioritet (soniya)" },
                  { key: "vipDelayMin", label: "👑 VIP (daqiqa)" },
                  { key: "regularDelayMin", label: "👤 Oddiy (daqiqa)" },
                ] as const
              ).map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[11px] font-semibold text-text-2">{f.label}</span>
                  <input
                    type="number"
                    value={cfg[f.key]}
                    onChange={(e) => setCfg((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-center text-sm font-bold text-ink outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <button
              onClick={saveCfg}
              className="press mt-3 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-black"
            >
              Saqlash
            </button>
          </AdminRow>

          <AdminRow title="📡 Tarqatish kanallari" subtitle="Qaysi kanalga, kimga va qachon yuborish">
            <div className="space-y-2">
              {targets.length === 0 && <p className="text-xs text-text-2">Hozircha target yo'q</p>}
              {targets.map((t) => {
                const tier = TIER_LABEL[t.tier] ?? TIER_LABEL.regular;
                return (
                  <div key={t.id} className="flex items-center gap-2 rounded-xl border border-line bg-card-hi/50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">
                        {t.channelTitle || "@" + t.channelUsername || "Nomsiz kanal"}
                      </p>
                      <p className="truncate text-xs text-text-2">
                        @{t.channelUsername || "username yo'q"} · ID {t.telegramId}
                      </p>
                      <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${tier.chip}`}>
                        {tier.label}
                      </span>
                    </div>
                    <button
                      onClick={() => testTarget(t)}
                      disabled={busyTarget === t.id || !t.channelUsername}
                      className="press rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11px] font-bold text-ink disabled:opacity-40"
                    >
                      {busyTarget === t.id ? "..." : "Test"}
                    </button>
                    <button
                      onClick={() => toggleTarget(t)}
                      className={`press h-6 w-11 rounded-full border transition-colors ${t.isActive ? "border-primary bg-primary" : "border-line bg-card-hi"}`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-white transition-transform ${t.isActive ? "translate-x-[22px]" : "translate-x-[2px]"}`}
                      />
                    </button>
                    <button onClick={() => removeTarget(t.id)} className="press text-text-2 active:text-red-400">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={form.telegramId}
                onChange={(e) => setForm((p) => ({ ...p, telegramId: e.target.value }))}
                placeholder="Telegram ID"
                inputMode="numeric"
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
              />
              <input
                value={form.channelUsername}
                onChange={(e) => setForm((p) => ({ ...p, channelUsername: e.target.value }))}
                placeholder="@kanal_nomi"
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
              />
              <input
                value={form.channelTitle}
                onChange={(e) => setForm((p) => ({ ...p, channelTitle: e.target.value }))}
                placeholder="Kanal nomi (ixtiyoriy)"
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
              />
              <select
                value={form.tier}
                onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))}
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
              >
                <option value="priority">⚡ Prioritet</option>
                <option value="vip">👑 VIP</option>
                <option value="regular">👤 Oddiy</option>
              </select>
            </div>
            <button
              onClick={addTarget}
              disabled={!form.telegramId.trim() || !form.channelUsername.trim()}
              className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-black disabled:opacity-40"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Kanal qo'shish
            </button>
          </AdminRow>

          <AdminRow title="📨 Yuborish navbati" subtitle="Keladigan postlar uchun rejalashtirilgan yuborishlar">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-2">{tasks.length} ta vazifa</span>
              <button onClick={clearFinished} className="press rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11px] font-bold text-ink">
                Yakunlanganlarni tozalash
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {tasks.length === 0 && <p className="text-xs text-text-2">Navbat bo'sh — post kelganda shu yerda paydo bo'ladi</p>}
              {tasks.map((t) => {
                const tier = TIER_LABEL[t.tier] ?? TIER_LABEL.regular;
                return (
                  <div key={t.id} className="rounded-xl border border-line bg-card-hi/50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusChip(t.status)}`}>
                        {t.status === "sent" ? "Yuborildi" : t.status === "failed" ? "Xato" : `Kutilmoqda · ${relTime(t.dueAt)}`}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tier.chip}`}>{tier.label}</span>
                      {t.status === "pending" && (
                        <button
                          onClick={() => sendNow(t.id)}
                          className="press rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-black"
                        >
                          Hoziroq yuborish
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-xs font-bold text-ink">{t.postRoute}</p>
                    <p className="line-clamp-2 text-xs text-text-2">{t.postText}</p>
                    <p className="mt-1 text-[11px] text-text-2">
                      @{t.channelUsername} · {t.status === "sent" ? `yuborildi ${fmtTime(t.sentAt)}` : `reja ${fmtTime(t.dueAt)}`}
                      {t.error ? ` · ⚠️ ${t.error}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminRow>
        </div>
      </div>
    </div>
  );
}
