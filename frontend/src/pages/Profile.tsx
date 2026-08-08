import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import ThemeSheet from "../components/ThemeSheet";
import { ChevronRightIcon, CrownIcon, ShieldIcon } from "../components/Icons";
import { telegram } from "../lib/telegram";
import { daysLeft, formatDateShort } from "../lib/format";

const themeLabels = { light: "Yorug'", dark: "Qorong'i", system: "Tizim" } as const;

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`h-[30px] w-[50px] shrink-0 rounded-full p-[2px] transition-colors duration-300 ${
        on ? "bg-[#34C759]" : "bg-card-hi"
      }`}
    >
      <span
        className={`block h-[26px] w-[26px] rounded-full bg-white shadow transition-transform duration-300 ${
          on ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  right,
  to,
  onClick,
}: {
  label: string;
  right: React.ReactNode;
  to?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-[14px] border border-line glass-chip px-4 py-3.5">
      <span className="flex-1 text-left text-[14px] font-medium text-ink">{label}</span>
      <span className="flex items-center gap-1.5 text-[13px] text-text-2">
        {right}
        {(to || onClick) && <ChevronRightIcon className="h-4 w-4" />}
      </span>
    </div>
  );
  if (onClick) {
    return (
      <button className="w-full" onClick={() => { telegram.haptic("light"); onClick(); }}>
        {content}
      </button>
    );
  }
  if (!to) return content;
  return (
    <Link to={to} onClick={() => telegram.haptic("light")}>
      {content}
    </Link>
  );
}

export default function Profile() {
  const { profile, favorites, config } = useData();
  const { mode } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [favRoute, setFavRoute] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  const vipActive = profile.isVip && daysLeft(profile.vipUntil) > 0;
  const initials = (profile.name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Profil</h1>

        <div className="glass-card mt-4 flex items-center gap-4 rounded-[22px] p-4 animate-fade-in-up">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full tile-gradient text-xl font-bold text-primary">
            {initials || "👤"}
            {vipActive && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-glow">
                <CrownIcon className="h-3.5 w-3.5 text-black" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold text-ink">{profile.name}</p>
            <p className="mt-0.5 truncate text-[13px] text-text-2">
              {profile.username ? `@${profile.username}` : "Telegram orqali kirdingiz"}
            </p>
            {vipActive ? (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                <CrownIcon className="h-3 w-3" /> VIP · {daysLeft(profile.vipUntil)} kun
              </span>
            ) : (
              <span className="mt-1.5 inline-flex items-center rounded-full bg-card-hi px-2.5 py-0.5 text-[11px] font-medium text-text-2">
                Oddiy foydalanuvchi
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <div className="glass-card rounded-[18px] p-3 text-center">
            <p className="text-[18px] font-bold text-ink">{favorites.size}</p>
            <p className="mt-0.5 text-[11px] text-text-2">Saqlangan</p>
          </div>
          <div className="glass-card rounded-[18px] p-3 text-center">
            <p className="text-[18px] font-bold text-primary">2</p>
            <p className="mt-0.5 text-[11px] text-text-2">Yo'nalish</p>
          </div>
          <div className="glass-card rounded-[18px] p-3 text-center">
            <p className="text-[18px] font-bold text-ink">
              {vipActive ? formatDateShort(profile.vipUntil).slice(0, 6) : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-text-2">VIP gacha</p>
          </div>
        </div>

        {!vipActive && (
          <Link
            to="/vip"
            onClick={() => telegram.haptic("medium")}
            className="press btn-sheen mt-3 flex items-center gap-3 rounded-[18px] vip-card p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-primary">
              <CrownIcon className="h-5 w-5 text-black" />
            </span>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-bold text-ink">VIP bo'lish</p>
              <p className="text-[12px] text-text-2">Cheksiz imkoniyatlar</p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-text-2" />
          </Link>
        )}

        <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-text-2">
          Sozlamalar
        </p>
        <div className="space-y-2">
          <SettingRow label="Tashqi ko'rinish" right={<span className="font-semibold text-ink">{themeLabels[mode]}</span>} onClick={() => setThemeOpen(true)} />
          <SettingRow label="Bildirishnomalar" right={<Toggle on={notifOn} onToggle={() => { telegram.haptic("light"); setNotifOn((v) => !v); }} />} />
          <SettingRow label="Sevimli yo'nalish" right={<Toggle on={favRoute} onToggle={() => { telegram.haptic("light"); setFavRoute((v) => !v); }} />} />
          <SettingRow label="Tovush" right={<Toggle on={soundOn} onToggle={() => { telegram.haptic("light"); setSoundOn((v) => !v); }} />} />
        </div>

        <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-text-2">
          Ilova
        </p>
        <div className="space-y-2">
          <SettingRow label="VIP holati" right={<span className="font-semibold text-primary">{vipActive ? "Faol" : "Yo'q"}</span>} to="/vip" />
          <SettingRow label="Saqlangan e'lonlar" right={<span className="font-semibold text-ink">{favorites.size}</span>} to="/favorites" />
        </div>

        {config.isAdmin && (
          <div className="mt-5 animate-scale-in">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-2">
              Boshqaruv
            </p>
            <Link
              to="/admin"
              onClick={() => telegram.haptic("medium")}
              className="press glass-card flex items-center gap-3 rounded-[16px] p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-card-hi">
                <ShieldIcon className="h-5 w-5 text-primary" />
              </span>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-bold text-ink">Boshqaruv paneli</p>
                <p className="text-[12px] text-text-2">Kanal, foydalanuvchi va daromad</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-text-2" />
            </Link>
          </div>
        )}

        <p className="mt-6 pb-2 text-center text-[11px] text-text-2">
          Taxi Collector v2.0 · Toshkent ↔ Andijon
        </p>
      </div>
      <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  );
}
