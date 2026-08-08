import { RouteFilter } from "../types";
import { telegram } from "../lib/telegram";

interface Props {
  filters: RouteFilter[];
  active: string;
  onChange: (id: string) => void;
}

export default function FilterChips({ filters, active, onChange }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-1">
      {filters.map((f) => {
        const isActive = f.id === active;
        return (
          <button
            key={f.id}
            onClick={() => {
              telegram.haptic("light");
              onChange(f.id);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 ${
              isActive
                ? "btn-sheen bg-primary text-black shadow-glow"
                : "border border-line bg-card-2 text-text-2 hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
