import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { AppUser } from "../../types";
import { AdminHeader } from "./AdminUi";
import { telegram } from "../../lib/telegram";
import { FeedSkeleton } from "../../components/Skeletons";
import { formatDateShort } from "../../lib/format";

export default function AdminUsers() {
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

  const toggleBlock = (u: AppUser) => {
    telegram.haptic(u.isBlocked ? "light" : "medium");
    if (u.isBlocked) telegram.notify("success");
    void api.admin.blockUser(u.id, !u.isBlocked).then(() => load());
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Foydalanuvchilar" subtitle="Barcha foydalanuvchilar" />

        <div className="mt-4 space-y-3">
          {loading ? (
            <FeedSkeleton count={4} />
          ) : (
            users.map((u, i) => (
              <div
                key={u.id}
                className={`rounded-xl2 border bg-card p-4 shadow-soft animate-fade-in-up ${
                  u.isBlocked ? "border-error/30 opacity-70" : "border-line"
                }`}
                style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card-hi text-lg">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[15px] font-bold text-ink">
                      {u.name}
                      {u.vip && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          👑 VIP
                        </span>
                      )}
                      {u.isBlocked && (
                        <span className="rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-bold text-error">
                          🚫 Bloklangan
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-2">
                      {u.username ? `@${u.username}` : `ID: ${u.telegramId}`} · {formatDateShort(u.registeredAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBlock(u)}
                    className={`press shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                      u.isBlocked ? "bg-primary text-black" : "bg-error/15 text-error"
                    }`}
                  >
                    {u.isBlocked ? "Blokdan chiqarish" : "🚫 Bloklash"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
