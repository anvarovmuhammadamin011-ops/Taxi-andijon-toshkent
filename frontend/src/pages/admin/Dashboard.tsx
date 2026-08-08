import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DashboardStats, RevenueStats } from "../../types";
import { AdminHeader, BarChart, StatCard } from "./AdminUi";
import { FeedSkeleton } from "../../components/Skeletons";
import { formatMoney } from "../../lib/format";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);

  useEffect(() => {
    void api.admin.dashboard().then((r) => r.ok && setStats(r.data));
    void api.admin.revenue().then((r) => r.ok && setRevenue(r.data));
  }, []);

  if (!stats) {
    return (
      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-28 pt-4 safe-top">
        <AdminHeader title="Dashboard" subtitle="Yuklanmoqda..." />
        <div className="mt-4">
          <FeedSkeleton count={3} />
        </div>
      </div>
    );
  }

  const grid = [
    { label: "👥 Foydalanuvchilar", value: stats.users, icon: "👥" },
    { label: "🟢 Bugun faol", value: stats.activeToday, icon: "🟢" },
    { label: "👑 VIP", value: stats.vip, icon: "👑" },
    { label: "📝 Bugungi e'lonlar", value: stats.todayPosts, icon: "📝" },
    { label: "📢 Faol kanallar", value: stats.activeChannels, icon: "📢" },
  ];

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Dashboard" subtitle="Bugungi holat" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          {grid.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
          ))}
          <StatCard label="💰 Bugungi daromad" value={`${formatMoney(stats.revenueToday)} so'm`} accent="var(--accent)" icon="💰" />
          <StatCard label="💰 Umumiy daromad" value={`${formatMoney(stats.revenueTotal)} so'm`} accent="var(--accent)" icon="💰" />
        </div>

        <div className="mt-3 rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up">
          <p className="text-xs font-semibold text-text-2">🔥 Eng faol yo'nalish</p>
          <p className="mt-1 text-lg font-extrabold text-ink">
            {stats.topRoute} <span className="text-primary">· {stats.topRouteCount} ta</span>
          </p>
        </div>

        <div className="mt-3 rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up">
          <p className="text-sm font-bold text-ink">📈 Oxirgi 30 kun daromad</p>
          {revenue && (
            <div className="mt-3">
              <BarChart data={revenue.history} />
              <p className="mt-2 text-xs text-text-2">
                Jami: <span className="font-bold text-primary">{formatMoney(revenue.total)} so'm</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
