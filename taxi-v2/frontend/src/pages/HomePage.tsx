import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostsContext';
import { routeLabel } from '../lib/types';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const { user } = useAuth();
  const { posts, newPost, botConfigured, removePost } = usePosts();
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [channels, setChannels] = useState<string[]>([]);
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

  const defaultRoute = user?.settings?.defaultRoute || 'toshkent_andijon';

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚕</span>
            <h1 className="font-bold text-[var(--text)]">Taxi Collector</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] px-2 py-1 rounded-full ${botConfigured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {botConfigured ? '● Bot' : '○ Demo'}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Hammasi' },
              { id: 'toshkent_andijon', label: 'Toshkent → Andijon' },
              { id: 'andijon_toshkent', label: 'Andijon → Toshkent' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRouteFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${
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
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text)]"
            >
              <option value="all">Barcha kanallar</option>
              {channels.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* New post flash */}
      {newPostFlash && (
        <div className="mx-4 mt-3 bg-[var(--accent)] text-white text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2">
          <span>🔔</span> Yangi yo'lovchi e'loni keldi!
        </div>
      )}

      {/* Posts */}
      <main className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-[var(--text-secondary)]">Hozircha e'lonlar yo'q</p>
            {routeFilter === 'all' && (
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Standart yo'nalishingiz: {routeLabel(defaultRoute)}
              </p>
            )}
          </div>
        ) : (
          filtered.map((post) => (
            <div key={post.id} className="relative">
              <PostCard post={post} />
              <button
                onClick={() => removePost(post.id)}
                className="absolute top-2 right-2 text-xs text-[var(--text-secondary)] bg-[var(--card)] rounded-lg px-2 py-1 border border-[var(--border)]"
                aria-label="O'chirish"
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
