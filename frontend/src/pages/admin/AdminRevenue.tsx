import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { RevenueStats } from "../../types";
import { AdminHeader, BarChart, StatCard } from "./AdminUi";
import { FeedSkeleton } from "../../components/Skeletons";
import { formatMoney } from "../../lib/format";

export default function AdminRevenue() {
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);

  useEffect(() => {
    void api.admin.revenue().then((r) => r.ok && setRevenue(r.data));
  }, []);

  if (!revenue) {
    return (
      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-28 pt-4 safe-top">
        <AdminHeader title="Daromad" subtitle="Yuklanmoqda..." />
        <div className="mt-4">
          <FeedSkeleton count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Daromad" subtitle="VIP va to'lovlar" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatCard label="💰 Bugun" value={`${formatMoney(revenue.today)} so'm`} accent="var(--accent)" />
          <StatCard label="📅 Bu oy" value={`${formatMoney(revenue.month)} so'm`} accent="var(--accent)" />
          <StatCard label="👑 VIP foydalanuvchilar" value={revenue.vipUsers} icon="👑" />
          <StatCard label="💳 To'lovlar" value={revenue.payments} icon="💳" />
        </div>

        <div className="mt-3 rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up">
          <p className="text-sm font-bold text-ink">📈 Oxirgi 30 kun</p>
          <div className="mt-3">
            <BarChart data={revenue.history} />
          </div>
          <p className="mt-2 text-xs text-text-2">
            Jami: <span className="font-bold text-primary">{formatMoney(revenue.total)} so'm</span>
          </p>
        </div>
      </div>
    </div>
  );
}
