import { useNavigate } from "react-router-dom";
import { RouteInfo } from "../types";
import { routeKey } from "../lib/format";
import { telegram } from "../lib/telegram";
import { ChevronRightIcon } from "./Icons";

interface Props {
  route: RouteInfo;
  index?: number;
  showAll?: boolean;
}

export default function RouteCard({ route, index = 0, showAll }: Props) {
  const navigate = useNavigate();
  const delay = Math.min(index * 50, 300);

  const go = () => {
    telegram.haptic("light");
    navigate(`/route/${encodeURIComponent(route.from)}/${encodeURIComponent(route.to)}`);
  };

  return (
    <button
      onClick={go}
      className="press flex w-full items-center gap-3 rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: `${route.color}1f`, color: route.color }}
      >
        {route.emoji}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[15px] font-bold text-ink">
          {showAll ? "Barchasi" : `${route.from} → ${route.to}`}
        </p>
        <p className="text-xs text-text-2">
          {showAll ? "Barcha yo'nalishlar" : routeKey(route.from, route.to)} •{" "}
          <span className="font-semibold text-primary">
            {route.postCount} ta e'lon
          </span>
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-text-2" />
    </button>
  );
}
