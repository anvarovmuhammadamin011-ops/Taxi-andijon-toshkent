import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostsContext';
import { greeting } from '../lib/format';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const { posts, newPost, removePost } = usePosts();
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [channels, setChannels] = useState<string[]>([]);
  const [greet] = useState(greeting());
  const [newPostFlash, setNewPostFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const uniqueChannels = Array.from(new Set(posts.map((p) => p.channelTitle)));
    setChannels(uniqueChannels);
  }, [posts]);

  useEffect(() => {
    if (newPost && newPost.classification === 'passenger' && !newPost.isDuplicate) {
      setNewPostFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setNewPostFlash(false), 3000);
    }
  }, [newPost]);

  const filtered = posts.filter((p) => {
    if (routeFilter !== 'all' && p.route !== routeFilter) return false;
    if (channelFilter !== 'all' && p.channelTitle !== channelFilter) return false;
    return true;
  });

  const passengerCount = posts.filter((p) => p.classification === 'passenger').length;

  const directionLabel =
    routeFilter === 'andijon_toshkent'
      ? 'Andijon → Toshkent'
      : routeFilter === 'toshkent_andijon'
      ? 'Toshkent → Andijon'
      : 'Barcha yo’nalishlar';

  const swapDirection = () => {
    setRouteFilter((prev) => {
      if (prev === 'toshkent_andijon') return 'andijon_toshkent';
      if (prev === 'andijon_toshkent') return 'toshkent_andijon';
      return 'toshkent_andijon';
    });
  };

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 pt-5 pb-3">
          <p className="text-sm text-[var(--text-secondary)]">{greet} 👋</p>
          <h1 className="text-2xl font-bold text-[var(--text)]">Taxi Finder</h1>

          {/* Yo'nalish almashtirish */}
          <button
            onClick={swapDirection}
            className="mt-3 w-full bg-[var(--card)] rounded-2xl p-3 border border-[var(--border)] flex items-center justify-between"
          >
            <span className="text-base font-semibold text-[var(--text)]">{directionLabel}</span>
            <span className="text-lg text-[var(--accent)]">🔄</span>
          </button>

          {/* LIVE */}
          <div className="mt-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--green)]">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" /> LIVE
            </span>
            <span className="text-xs text-[var(--text-secondary)]">{passengerCount} ta yangi yo’lovchi</span>
          </div>
        </div>

        {/* Filtr chiplari */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Barcha' },
            { id: 'toshkent_andijon', label: 'Toshkent → Andijon' },
            { id: 'andijon_toshkent', label: 'Andijon → Toshkent' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRouteFilter(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                routeFilter === r.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {channels.length > 1 && (
          <div className="px-4 pb-3">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)]"
            >
              <option value="all">Barcha kanallar</option>
              {channels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Yangi post flash */}
      {newPostFlash && (
        <div className="mx-4 mt-3 bg-[var(--green)] text-white text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <span>🔔</span> Yangi yo’lovchi e’loni keldi!
        </div>
      )}

      {/* Postlar */}
      <main className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-[var(--text-secondary)]">Hozircha e’lonlar yo’q</p>
          </div>
        ) : (
          filtered.map((post) => (
            <div key={post.id} className="relative fade-in">
              <PostCard post={post} />
              <button
                onClick={() => removePost(post.id)}
                className="absolute top-2 right-2 text-xs text-[var(--text-secondary)] bg-[var(--card)] rounded-lg px-2 py-1 border border-[var(--border)] opacity-60 hover:opacity-100"
                aria-label="O’chirish"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
