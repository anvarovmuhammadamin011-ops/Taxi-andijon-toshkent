import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import EmptyState from "../components/EmptyState";
import { FeedSkeleton } from "../components/Skeletons";
import { telegram } from "../lib/telegram";
import { ChevronRightIcon } from "../components/Icons";

export default function Channels() {
  const { channels, loading } = useData();
  const navigate = useNavigate();

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
      <div className="px-4 pt-4 safe-top">
        <h1 className="text-2xl font-extrabold tracking-wide">
          Man<span className="text-primary">balar</span>
        </h1>
        <p className="mt-0.5 text-[13px] text-text-2">
          E'lonlar qaysi kanallardan yig'iladi
        </p>

        <div className="mt-4">
          {loading ? (
            <FeedSkeleton count={4} />
          ) : channels.length === 0 ? (
            <EmptyState title="Kanallar topilmadi" />
          ) : (
            <div className="space-y-3">
              {channels.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    telegram.haptic("light");
                    navigate(`/channel/${c.id}`);
                  }}
                  className="press glass-card flex w-full items-center gap-3 rounded-[20px] p-4 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <div className="tile-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-xl shadow-soft">
                    🚕
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[15px] font-bold text-ink">{c.title}</p>
                    <p className="text-xs text-text-2">
                      <span className="font-semibold text-primary">{c.postCount} ta e'lon</span>
                    </p>
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      c.isActive ? "bg-success/15 text-success" : "bg-error/15 text-error"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        c.isActive ? "animate-pulse bg-success" : "bg-error"
                      }`}
                    />
                    {c.isActive ? "Faol" : "Pauza"}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-text-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
