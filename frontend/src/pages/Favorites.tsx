import { useMemo } from "react";
import { useData } from "../context/DataContext";
import FeedList from "../components/FeedList";
import EmptyState from "../components/EmptyState";

export default function Favorites() {
  const { posts, favorites } = useData();

  const saved = useMemo(
    () =>
      posts
        .filter((p) => favorites.has(p.id))
        .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()),
    [posts, favorites]
  );

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Saqlanganlar</h1>
        <p className="mt-0.5 text-[13px] font-medium text-text-2">
          ♥ {saved.length} ta e'lon saqlangan
        </p>

        <div className="mt-4">
          {saved.length === 0 ? (
            <EmptyState
              icon="♡"
              title="Saqlanganlar bo'sh"
              subtitle="E'londagi ♡ tugmasini bosib e'lonni shu yerga saqlang"
            />
          ) : (
            <FeedList posts={saved} />
          )}
        </div>
      </div>
    </div>
  );
}
