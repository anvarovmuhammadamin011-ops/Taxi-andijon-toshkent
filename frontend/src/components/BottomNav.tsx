import { NavLink } from "react-router-dom";
import { HomeIcon, ChannelIcon, StarIcon, UserIcon } from "./Icons";

const tabs = [
  { to: "/", label: "Bosh sahifa", Icon: HomeIcon, end: true },
  { to: "/channels", label: "Kanallar", Icon: ChannelIcon, end: false },
  { to: "/favorites", label: "Saqlanganlar", Icon: StarIcon, end: false },
  { to: "/profile", label: "Profil", Icon: UserIcon, end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-[max(env(safe-area-inset-bottom),12px)] safe-bottom">
      <div className="glass flex items-center justify-between rounded-[28px] px-2 py-2">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group flex flex-1 flex-col items-center gap-1 py-1.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative flex h-9 w-16 items-center justify-center overflow-hidden rounded-[22px] transition-all duration-300 ${
                    isActive
                      ? "glass-chip text-black"
                      : "text-text-2 group-active:scale-90"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "text-primary" : ""}`} />
                  {isActive && (
                    <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-[22px] bg-white/30" />
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium leading-none transition-all duration-300 ${
                    isActive ? "text-ink font-bold" : "text-text-2"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
