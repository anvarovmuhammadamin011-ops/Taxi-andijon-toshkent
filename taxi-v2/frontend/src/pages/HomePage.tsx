import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

interface Post {
  id: string;
  originalText: string;
  route: string;
  passengerCount: number | null;
  phone: string | null;
  channelTitle: string;
  collectedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { connected, lastEvent } = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Listen for real-time events
  useEffect(() => {
    if (lastEvent?.type === 'new-post') {
      setPosts((prev) => [lastEvent.data, ...prev].slice(0, 65));
    }
    if (lastEvent?.type === 'remove-post') {
      setPosts((prev) => prev.filter((p) => p.id !== lastEvent.data));
    }
  }, [lastEvent]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚕</span>
            <h1 className="font-bold text-[var(--text)]">Taxi Collector</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} />
            <button onClick={logout} className="text-sm text-[var(--text-secondary)]">
              Chiqish
            </button>
          </div>
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-lg mx-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-[var(--text-secondary)]">Yuklanmoqda...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-[var(--text-secondary)]">Hozircha e'lonlar yo'q</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </main>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const routeLabel =
    post.route === 'toshkent_andijon'
      ? 'Toshkent → Andijon'
      : post.route === 'andijon_toshkent'
      ? 'Andijon → Toshkent'
      : post.route;

  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium">
          {routeLabel}
        </span>
        {post.passengerCount && (
          <span className="text-xs text-[var(--text-secondary)]">{post.passengerCount} kishi</span>
        )}
      </div>

      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
        {post.originalText}
      </p>

      {post.phone && (
        <a
          href={`tel:+998${post.phone}`}
          className="mt-3 flex items-center justify-center gap-2 bg-[var(--green)] text-white font-semibold py-2.5 rounded-xl"
        >
          📞 Qo'ng'iroq qilish
        </a>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{post.channelTitle}</span>
        <span>{new Date(post.collectedAt).toLocaleTimeString('uz-UZ')}</span>
      </div>
    </div>
  );
}
