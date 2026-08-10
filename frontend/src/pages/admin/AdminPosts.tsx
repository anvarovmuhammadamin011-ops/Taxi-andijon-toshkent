import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Post } from "../../types";
import { AdminHeader } from "./AdminUi";
import SearchBar from "../../components/SearchBar";
import EmptyState from "../../components/EmptyState";
import { FeedSkeleton } from "../../components/Skeletons";
import { telegram } from "../../lib/telegram";
import { TrashIcon } from "../../components/Icons";
import { formatPhonesInText, timeAgo } from "../../lib/format";

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = (q = "") =>
    api.admin.posts(q).then((r) => {
      if (r.ok) setPosts(r.data);
      setLoading(false);
    });

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const remove = (p: Post) => {
    telegram.haptic("medium");
    telegram.notify("warning");
    void api.admin.deletePost(p.id).then(() => load(query));
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Postlar" subtitle="Moderatsiya" />
        <div className="mt-4">
          <SearchBar value={query} onChange={setQuery} placeholder="Post qidirish..." />
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <FeedSkeleton count={4} />
          ) : posts.length === 0 ? (
            <EmptyState title="Postlar topilmadi" />
          ) : (
            posts.map((p, i) => (
              <div
                key={p.id}
                className="rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
              >
                <div className="flex items-center gap-2 text-xs text-text-2">
                  <span className="font-bold text-primary">{p.channelTitle}</span>
                  <span>· {p.from} → {p.to}</span>
                  <span className="ml-auto">{timeAgo(p.postedAt)}</span>
                </div>
                <p className="mt-2 text-[15px] leading-snug text-ink">{formatPhonesInText(p.text)}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => remove(p)}
                    className="press flex items-center gap-1.5 rounded-lg bg-error/15 px-3 py-2 text-xs font-bold text-error"
                  >
                    <TrashIcon className="h-4 w-4" />
                    O'chirish
                  </button>
                  <span className="ml-auto text-xs text-text-2">🆔 {p.messageId}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
