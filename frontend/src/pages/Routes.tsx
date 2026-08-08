import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { ArrowDownIcon } from "../components/Icons";
import { routeKey } from "../lib/format";
import { telegram } from "../lib/telegram";

export default function Routes() {
  const { routes, posts } = useData();

  const countFor = (from: string, to: string) =>
    posts.filter((p) => routeKey(p.from, p.to) === routeKey(from, to)).length;

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Yo'nalishlar</h1>
        <p className="mt-0.5 text-[13px] font-medium text-text-2">
          Toshkent ↔ Andijon va boshqa yo'nalishlar
        </p>

        <div className="mt-4 space-y-2.5">
          {routes.map((r, i) => {
            const count = countFor(r.from, r.to);
            return (
              <Link
                key={routeKey(r.from, r.to)}
                to={`/route/${encodeURIComponent(r.from)}/${encodeURIComponent(r.to)}`}
                onClick={() => telegram.haptic("light")}
                className="press glass-card flex items-center gap-3.5 rounded-[20px] p-4 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ backgroundColor: `${r.color}26` }}
                >
                  <ArrowDownIcon className="h-5 w-5" style={{ color: r.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-ink">
                    {r.from} <span style={{ color: r.color }}>↓</span> {r.to}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-2">{count} ta e'lon</p>
                </div>
                <span className="glass-chip shrink-0 rounded-full px-3 py-1 text-[12px] font-bold text-ink/80">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
