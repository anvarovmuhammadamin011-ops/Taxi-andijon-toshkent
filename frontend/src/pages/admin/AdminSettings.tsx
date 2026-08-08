import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useData } from "../../context/DataContext";
import { AdminHeader, AdminRow } from "./AdminUi";
import { telegram } from "../../lib/telegram";
import { PlusIcon, TrashIcon } from "../../components/Icons";

export default function AdminSettings() {
  const { config, refresh } = useData();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(config.postLimit);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string>("");

  const load = () => api.admin.keywords().then((r) => r.ok && setKeywords(r.data));

  useEffect(() => {
    void load();
  }, []);

  const addKeyword = () => {
    if (!keyword.trim()) return;
    telegram.haptic("light");
    void api.admin.addKeyword(keyword.trim()).then((r) => {
      if (r.ok) {
        setKeywords(r.data);
        setKeyword("");
      }
    });
  };

  const removeKeyword = (kw: string) => {
    telegram.haptic("light");
    void api.admin.removeKeyword(kw).then((r) => r.ok && setKeywords(r.data));
  };

  const saveLimit = () => {
    telegram.haptic("medium");
    telegram.notify("success");
    void api.admin.setLimit(Number(limit)).then(() => refresh());
  };

  const simulate = async () => {
    setSimulating(true);
    const res = await api.admin.simulate();
    setSimulating(false);
    if (res.ok && res.data) {
      telegram.notify(res.data.status === "new" ? "success" : "warning");
      setSimResult(
        res.data.status === "new"
          ? `✅ Yangi post qo'shildi → ${res.data.parsed.route} (${res.data.parsed.phone ?? "tel yo'q"})`
          : `♻️ Duplicate topildi → ${res.data.parsed.route}. Yangi post qo'shilmadi.`
      );
      void refresh();
    } else {
      setSimResult("⚠️ Backend ulanmagan — demo rejim");
    }
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Sozlamalar" subtitle="Collector sozlamalari" />

        <div className="mt-4 space-y-3">
          <AdminRow title="📝 Post limiti" subtitle="Har bir yo'nalishda saqlanadigan maksimal e'lonlar soni">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-24 rounded-xl border border-line bg-bg px-4 py-2.5 text-center text-sm font-bold text-ink outline-none focus:border-primary"
              />
              <span className="text-xs text-text-2">
                {limit}-chi e'lon kelganda eng eskisi o'chadi
              </span>
              <button
                onClick={saveLimit}
                className="press ml-auto rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-black"
              >
                Saqlash
              </button>
            </div>
          </AdminRow>

          <AdminRow title="🔑 Keywords" subtitle="Yo'nalishni aniqlashda ishlatiladigan kalit so'zlar">
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1.5 rounded-full bg-card-hi border border-line px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="text-text-2 active:opacity-60">
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Yangi keyword..."
                className="flex-1 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
              />
              <button
                onClick={addKeyword}
                className="press flex items-center gap-1 rounded-xl bg-primary px-4 text-xs font-bold text-black"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Qo'shish
              </button>
            </div>
          </AdminRow>

          <AdminRow title="⚡ Test: yangi post simulyatsiyasi" subtitle="Telegram kanalidan kelgandek yangi post yaratadi (parser + duplicate tekshiruvi)">
            <button
              onClick={simulate}
              disabled={simulating}
              className="press flex w-full items-center justify-center gap-2 rounded-xl bg-card-hi border border-line py-3 text-sm font-bold text-ink disabled:opacity-50"
            >
              {simulating ? "Ishlanmoqda..." : "🚕 Yangi post yuborish (simulyatsiya)"}
            </button>
            {simResult && (
              <p className="mt-2 text-xs font-medium text-text-2 animate-fade-in">{simResult}</p>
            )}
          </AdminRow>
        </div>
      </div>
    </div>
  );
}
