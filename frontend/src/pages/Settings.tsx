import { useState } from "react";
import { Link } from "react-router-dom";
import Toggle from "../components/Toggle";
import {
  BellIcon,
  ChevronRightIcon,
  CrownIcon,
  GlobeIcon,
  InfoIcon,
  SearchIcon,
  ShieldIcon,
  ThemeIcon,
} from "../components/Icons";
import { telegram } from "../lib/telegram";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import ThemeSheet from "../components/ThemeSheet";
import { daysLeft } from "../lib/format";

const themeLabels = { light: "Yorug'", dark: "Qorong'i", system: "Tizim" } as const;

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  toggle?: { checked: boolean; onChange: (v: boolean) => void };
}

function Row({ icon, label, value, to, onClick, danger, toggle }: RowProps) {
  const content = (
    <div className="flex w-full items-center gap-3 px-4 py-3.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          danger ? "bg-error/15 text-error" : "bg-card-hi text-text-2"
        }`}
      >
        {icon}
      </span>
      <span className={`flex-1 text-left text-[15px] font-medium ${danger ? "text-error" : "text-ink"}`}>
        {label}
      </span>
      {toggle ? (
        <Toggle checked={toggle.checked} onChange={toggle.onChange} />
      ) : (
        <>
          {value && <span className="text-[13px] text-text-2">{value}</span>}
          <ChevronRightIcon className="h-4 w-4 text-text-2" />
        </>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="press block">
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="press block w-full">
      {content}
    </button>
  );
}

export default function Settings() {
  const { profile, config } = useData();
  const { mode } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [routeOnly, setRouteOnly] = useState(false);

  const vipActive = profile.isVip && daysLeft(profile.vipUntil) > 0;

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
      <div className="px-4 pt-4 safe-top">
        <h1 className="text-2xl font-extrabold tracking-wide">
          Sozlam<span className="text-primary">alar</span>
        </h1>

        <Link
          to="/profile"
          onClick={() => telegram.haptic("light")}
          className="press glass-card mt-4 flex items-center gap-3 rounded-xl2 p-4 animate-fade-in-up"
        >
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card-hi text-2xl">
            👤
            {vipActive && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <CrownIcon className="h-3 w-3 text-black" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-ink">{profile.name}</p>
            <p className="text-xs text-text-2">
              {profile.username ? `@${profile.username}` : "Telegram orqali kirdingiz"} · Profilni ko'rish
            </p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-text-2" />
        </Link>

        <div className="mt-3 space-y-3">
          <div className="overflow-hidden rounded-xl2 glass-card animate-fade-in-up">
            <Row
              icon={<BellIcon className="h-5 w-5" />}
              label="Bildirishnomalar"
              toggle={{ checked: notifications, onChange: setNotifications }}
            />
            <div className="mx-4 h-px bg-line" />
            <Row
              icon={<SearchIcon className="h-5 w-5" />}
              label="Qidiruvda faqat yo'nalishlar"
              toggle={{ checked: routeOnly, onChange: setRouteOnly }}
            />
          </div>

          <div className="overflow-hidden rounded-xl2 glass-card animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <Row
              icon={<ThemeIcon className="h-5 w-5" />}
              label="Tashqi ko'rinish"
              value={themeLabels[mode]}
              onClick={() => setThemeOpen(true)}
            />
            <div className="mx-4 h-px bg-line" />
            <Row
              icon={<CrownIcon className="h-5 w-5 text-primary" />}
              label="VIP obuna"
              value={vipActive ? "Faol" : "Yo'q"}
              to="/vip"
              onClick={() => telegram.haptic("light")}
            />
            <div className="mx-4 h-px bg-line" />
            <Row
              icon={<GlobeIcon className="h-5 w-5" />}
              label="Til"
              value="O'zbekcha"
              onClick={() => telegram.notify("warning")}
            />
          </div>

          <div className="overflow-hidden rounded-xl2 glass-card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <Row icon={<InfoIcon className="h-5 w-5" />} label="Ilova haqida" onClick={() => telegram.notify("success")} />
            <div className="mx-4 h-px bg-line" />
            <Row icon={<ShieldIcon className="h-5 w-5" />} label="Maxfiylik" onClick={() => telegram.notify("success")} />
          </div>

          {config.isAdmin && (
            <Link
              to="/admin"
              onClick={() => telegram.haptic("light")}
              className="press mt-3 flex w-full items-center justify-center gap-2 rounded-xl2 border border-primary/40 bg-primary/10 py-3.5 text-[15px] font-bold text-primary animate-fade-in-up"
            >
              ⚙️ ADMIN PANEL → KIRISH
            </Link>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-1 pb-4 text-center">
          <span className="text-sm font-bold text-ink">
            Taxi <span className="text-primary">Collector</span>
          </span>
          <span className="text-xs text-text-2">Version 1.0.0 · Demo</span>
        </div>
      </div>
      <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  );
}
