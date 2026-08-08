import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import EmptyState from "../components/EmptyState";
import { BellIcon } from "../components/Icons";
import PageHeader from "../components/PageHeader";
import { telegram } from "../lib/telegram";
import { timeAgo } from "../lib/format";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function Notifications() {
  const { posts } = useData();
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const items = posts
      .slice()
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      .slice(0, 20);
    const byDay = new Map<string, typeof items>();
    for (const p of items) {
      const date = new Date(p.postedAt);
      const today = new Date();
      const label = sameDay(date, today) ? "Bugun" : sameDay(date, new Date(today.getTime() - 86400000)) ? "Kecha" : date.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
      if (!byDay.has(label)) byDay.set(label, []);
      byDay.get(label)!.push(p);
    }
    return [...byDay.entries()];
  }, [posts]);

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <PageHeader title="Bildirishnomalar" onBack={() => navigate("/")} />

        {groups.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Bildirishnomalar yo'q"
            subtitle="Yangi e'lonlar kelganda shu yerda ko'rinadi"
          />
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map(([label, items]) => (
              <div key={label}>
                <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-text-2">
                  {label}
                </p>
                <div className="space-y-2">
                  {items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        telegram.haptic("light");
                        navigate(`/post/${p.id}`);
                      }}
                      className="press glass-card flex w-full items-center gap-3 rounded-[18px] p-3.5 text-left animate-fade-in-up"
                    >
                      <span className="tile-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base shadow-soft">
                        🚕
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">
                          Yangi taxi e'loni · {p.from} → {p.to}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-text-2">
                          {p.seats != null && `${p.seats} ta odam`}
                          {p.seats != null && p.phone && " · "}
                          {p.phone && `📞 ${p.phone}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-text-2">{timeAgo(p.postedAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass-card mt-6 rounded-[18px] p-4">
          <div className="flex items-center gap-3">
            <BellIcon className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-ink">Sevimli yo'nalish bildirishnomasi</p>
              <p className="text-[12px] text-text-2">Toshkent → Andijon bo'yicha darhol xabar</p>
            </div>
            <button
              onClick={() => telegram.notify("success")}
              className="press btn-primary rounded-[12px] px-3.5 py-2 text-[12px] font-bold"
            >
              Yoqish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
