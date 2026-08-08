import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import EmptyState from "../../components/EmptyState";
import { telegram } from "../../lib/telegram";
import { ChevronRightIcon } from "../../components/Icons";

const sections = [
  { to: "/admin", label: "📊 Dashboard", desc: "Biznes holati" },
  { to: "/admin/channels", label: "📢 Kanallar", desc: "Qo'shish, o'chirish, pauza" },
  { to: "/admin/users", label: "👥 Foydalanuvchilar", desc: "Bloklash, ko'rish" },
  { to: "/admin/posts", label: "📝 Postlar", desc: "Moderatsiya" },
  { to: "/admin/vip", label: "👑 VIP obuna", desc: "VIP obunachilar" },
  { to: "/admin/revenue", label: "💰 Daromad", desc: "VIP va to'lovlar" },
  { to: "/admin/settings", label: "⚙️ Sozlamalar", desc: "Limit, keywords, test" },
  { to: "/admin/bot", label: "🤖 Bot & Tarqatish", desc: "Kanalga post yuborish" },
];

export default function AdminPanel() {
  const { profile } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    telegram.showBackButton(() => navigate("/profile"));
    return () => telegram.hideBackButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile.isAdmin) {
    return (
      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-24 pt-4 safe-top">
        <EmptyState
          icon="🔒"
          title="Ruxsat yo'q"
          subtitle="Admin panelga faqat administratorlar kira oladi"
        />
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
      <div className="px-4 pt-4 safe-top">
        <h1 className="text-2xl font-extrabold tracking-wide">
          ADMIN <span className="text-primary">PANEL</span>
        </h1>
        <p className="mt-0.5 text-[13px] text-text-2">Boshqaruv markazi</p>

        <div className="mt-4 space-y-3">
          {sections.map((s, i) => (
            <Link
              key={s.to}
              to={s.to}
              className="press flex w-full items-center gap-3 rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card-hi text-lg">
                {s.label.split(" ")[0]}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[15px] font-bold text-ink">{s.label.split(" ")[1]}</p>
                <p className="text-xs text-text-2">{s.desc}</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-text-2" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
