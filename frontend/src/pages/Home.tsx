import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import FilterChips from "../components/FilterChips";
import FeedList from "../components/FeedList";
import { BellIcon, ChevronRightIcon, SearchIcon } from "../components/Icons";
import { telegram } from "../lib/telegram";
import { FilterId, RouteFilter } from "../types";
import { routeKey } from "../lib/format";

const routeFilters: RouteFilter[] = [
  { id: "all", label: "Barchasi" },
  { id: "tashkent-andijon", label: "Toshkent → Andijon" },
  { id: "andijon-tashkent", label: "Andijon → Toshkent" },
];

export default function Home() {
  const { posts, channels, routes, loading, refresh, newPostsCount, showNewPosts } = useData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterId>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullingAmt, setPullingAmt] = useState(0);

  const today = new Date().toDateString();
  const todayPosts = useMemo(
    () => posts.filter((p) => new Date(p.postedAt).toDateString() === today).length,
    [posts, today]
  );
  const activeChannels = useMemo(() => channels.filter((c) => c.isActive).length, [channels]);

  const channelChips = useMemo(
    () => [{ id: "all", label: "Barcha kanallar" }, ...channels.map((c) => ({ id: c.id, label: c.title }))],
    [channels]
  );

  const filtered = useMemo(() => {
    return posts
      .filter((p) => {
        if (filter === "tashkent-andijon") return routeKey(p.from, p.to) === "Toshkent -> Andijon";
        if (filter === "andijon-tashkent") return routeKey(p.from, p.to) === "Andijon -> Toshkent";
        return true;
      })
      .filter((p) => (channelFilter === "all" ? true : p.channelId === channelFilter));
  }, [posts, filter, channelFilter]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && delta < 90) {
      setPulling(true);
      setPullingAmt(delta);
    }
  };

  const onTouchEnd = () => {
    if (pulling && pullingAmt >= 55) {
      setPullingAmt(0);
      void refresh().finally(() => setPulling(false));
    } else {
      setPulling(false);
      setPullingAmt(0);
    }
    startY.current = null;
  };

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="px-5 pt-4 safe-top">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-ink">Taxi Collector</h1>
            <p className="mt-0.5 text-[13px] font-medium text-text-2">Toshkent ↔ Andijon</p>
          </div>
          <button
            onClick={() => {
              telegram.haptic("light");
              navigate("/notifications");
            }}
            className="press glass relative flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Bildirishnomalar"
          >
            <BellIcon className="h-5 w-5 text-text-2" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>

        <div
          className={`mt-2 overflow-hidden transition-all duration-300 ${
            pulling ? "h-8 opacity-100" : "h-0 opacity-0"
          }`}
        >
          <div className="flex items-center justify-center">
            <div
              className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
              style={{ transform: `rotate(${pullingAmt * 4}deg)` }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            telegram.haptic("light");
            navigate("/search");
          }}
          className="press glass mt-3 flex w-full items-center gap-3 rounded-[18px] px-4 py-3.5"
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-text-2" />
          <span className="text-[15px] text-text-2">Qidirish...</span>
        </button>

        <section className="glass-card relative mt-4 overflow-hidden rounded-[24px] p-5 animate-fade-in-up">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Eng faol yo'nalish
              </p>
              <p className="mt-1.5 text-[20px] font-extrabold leading-tight tracking-tight text-ink">
                Toshkent ↔ Andijon
              </p>
              <p className="mt-1 text-[13px] text-text-2">{todayPosts} ta e'lon bugun</p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full tile-gradient shadow-soft">
              <img src="/logo.png" alt="Taxi Collector" className="h-full w-full object-cover" />
            </div>
          </div>
          <button
            onClick={() => {
              telegram.haptic("light");
              navigate("/routes");
            }}
            className="btn-primary press relative mt-4 flex w-full items-center justify-center gap-1.5 rounded-[16px] px-4 py-3 text-[14px] font-bold"
          >
            Yo'nalishlarni ko'rish
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </section>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { value: todayPosts, label: "Bugungi e'lon" },
            { value: activeChannels, label: "Faol kanal" },
            { value: routes.length, label: "Yo'nalish" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="glass-card rounded-2xl px-2 py-3 text-center animate-fade-in-up"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <p className="text-lg font-extrabold tracking-tight text-ink">{s.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-text-2">{s.label}</p>
            </div>
          ))}
        </div>

        {newPostsCount > 0 && (
          <button
            onClick={() => {
              telegram.haptic("medium");
              showNewPosts();
            }}
            className="press mt-3 flex w-full items-center justify-between rounded-[14px] bg-primary/10 px-4 py-3 animate-scale-in"
          >
            <span className="text-[13px] font-bold text-primary">✨ {newPostsCount} ta yangi e'lon</span>
            <span className="text-[12px] font-semibold text-ink">Ko'rish →</span>
          </button>
        )}

        <div className="mt-4">
          <FilterChips filters={routeFilters} active={filter} onChange={(id) => setFilter(id as FilterId)} />
        </div>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {channelChips.map((c) => {
            const active = channelFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  telegram.haptic("light");
                  setChannelFilter(c.id);
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-300 ${
                  active
                    ? "btn-sheen bg-primary text-black shadow-glow"
                    : "border border-line bg-card-2 text-text-2 hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="mb-3 mt-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">Yangi e'lonlar</h2>
          <button
            onClick={() => {
              telegram.haptic("light");
              void refresh();
            }}
            className="press text-[12px] font-semibold text-text-2"
          >
            Yangilash ↻
          </button>
        </div>
      </div>

      <div className="px-4">
        <FeedList
          posts={filtered}
          loading={loading}
          emptyTitle={filter === "all" ? "E'lonlar yo'q" : "Bu yo'nalishda e'lonlar yo'q"}
          emptySubtitle="Boshqa yo'nalish yoki kanalni tanlang"
        />
      </div>
    </div>
  );
}
