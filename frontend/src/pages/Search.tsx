import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import FeedList from "../components/FeedList";
import EmptyState from "../components/EmptyState";
import { SearchIcon } from "../components/Icons";
import BackButton from "../components/BackButton";
import { telegram } from "../lib/telegram";

const suggestions = ["Toshkent", "Andijon", "Haqqulobod", "Taxi", "992028222", "901234567"];

export default function Search() {
  const { visiblePosts, loading } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    telegram.showBackButton(() => navigate("/"));
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => {
      clearTimeout(t);
      telegram.hideBackButton();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return visiblePosts.filter((p) =>
      [p.text, p.from, p.to, p.phone, p.channelTitle, p.driverName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [visiblePosts, query]);

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <div className="flex items-center gap-2.5">
          <BackButton onClick={() => navigate("/")} />
          <div className="flex flex-1 items-center gap-3 rounded-[18px] glass px-4 py-3">
            <SearchIcon className="h-5 w-5 shrink-0 text-text-2" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-transparent text-[15px] text-ink placeholder:text-text-2 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-card-hi text-[11px] text-text-2"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {!query && (
          <div className="mt-6 animate-fade-in">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-2">
              Tez qidiruv
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    telegram.haptic("light");
                    setQuery(s);
                  }}
                  className="press rounded-full border border-line bg-card-2 px-4 py-2 text-[13px] font-medium text-ink/80 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          {!query ? (
            <EmptyState
              icon="🔎"
              title="Nima qidiramiz?"
              subtitle="Yo'nalish, shahar, telefon raqami yoki kanal nomi bo'yicha qidiring"
            />
          ) : (
            <>
              <p className="mb-3 text-[12px] text-text-2">
                "{query}" bo'yicha {results.length} ta natija
              </p>
              <FeedList
                posts={results}
                loading={loading}
                emptyTitle="Hech narsa topilmadi"
                emptySubtitle={`"${query}" bo'yicha natija yo'q. Qidiruv so'zini o'zgartiring.`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
