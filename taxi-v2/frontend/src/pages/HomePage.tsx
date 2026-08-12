import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../lib/api';
import { Post, routeLabel } from '../lib/types';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const { user } = useAuth();
  const { connected, newPost, removedPostId } = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [channels, setChannels] = useState<string[]>([]);
  const [newPostFlash, setNewPostFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPosts = useCallback(async () => {
    const res = await api<Post[]>('/api/posts');
    if (res.ok) {
      setPosts(res.data);
      const uniqueChannels = Array.from(new Set(res.data.map((p) => p.channelTitle)));
      setChannels((prev) => (prev.length === uniqueChannels.length ? prev : uniqueChannels));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (newPost && newPost.classification === 'passenger' && !newPost.isDuplicate) {
      setPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== newPost.id);
        return [newPost, ...filtered].slice(0, 65);
      });
      if (!channels.includes(newPost.channelTitle)) {
        setChannels((prev) => (prev.includes(newPost.channelTitle) ? prev : [...prev, newPost.channelTitle]));
      }
      setNewPostFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setNewPostFlash(false), 3000);
    }
  }, [newPost, channels]);

  useEffect(() => {
    if (removedPostId) {
      setPosts((prev) => prev.filter((p) => p.id !== removedPostId));
    }
  }, [removedPostId]);

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
            <span className={`text-[10px] px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {connected ? '● Online' : '○ Offline'}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-lg leading-none disabled:opacity-50"
              aria-label="Yangilash"
            >
              {refreshing ? '⏳' : '🔄'}
            </button>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-[var(--text-secondary)]">Yuklanmoqda...</p>
          </div>
        ) : filtered.length === 0 ? (
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
          filtered.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </main>
    </div>
  );
}