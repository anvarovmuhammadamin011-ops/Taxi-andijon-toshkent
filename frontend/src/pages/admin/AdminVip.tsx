import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { AppUser } from "../../types";
import { AdminHeader } from "./AdminUi";
import { FeedSkeleton } from "../../components/Skeletons";
import { formatDateShort, daysLeft } from "../../lib/format";
import { CrownIcon } from "../../components/Icons";

export default function AdminVip() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.admin.users().then((r) => {
      if (r.ok) setUsers(r.data);
      setLoading(false);
    });

  useEffect(() => {
    void load();
  }, []);

  const vipUsers = users.filter((u) => u.vip);

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="VIP obunachilar" subtitle="Faol VIP foydalanuvchilar" />

        <div className="mt-4 space-y-3">
          {loading ? (
            <FeedSkeleton count={4} />
          ) : vipUsers.length === 0 ? (
            <p className="text-center text-[13px] text-text-2">VIP obunachilar yo'q</p>
          ) : (
            vipUsers.map((u, i) => (
              <div
                key={u.id}
                className="rounded-xl2 border border-primary/25 bg-card p-4 shadow-soft animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <CrownIcon className="h-5 w-5 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink">{u.name}</p>
                    <p className="text-xs text-text-2">
                      {u.username ? `@${u.username}` : `ID: ${u.telegramId}`} · {formatDateShort(u.registeredAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10.5px] font-bold text-primary">
                    {u.vipUntil ? `${daysLeft(u.vipUntil)} kun` : "Cheksiz"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
