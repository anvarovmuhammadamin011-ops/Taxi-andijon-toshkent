import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Post } from '../lib/types';
import { api, apiAdmin } from '../lib/api';

const POSTS_KEY = 'taxi_posts';

function samplePosts(): Post[] {
  const now = Date.now();
  const base: Array<{ text: string; route: Post['route']; phone: string }> = [
    { text: 'Тошкентга юрамиз 2та кам машина kerak', route: 'toshkent_andijon', phone: '998218408' },
    { text: 'Andijonga ketmoqchiman, 3 kishi, mashina kerak', route: 'andijon_toshkent', phone: '901234567' },
    { text: 'Тошкентдан Баликчига юрамиз 2 та одамимиз кам', route: 'toshkent_andijon', phone: '998765432' },
  ];
  return base.map((p, i) => ({
    id: `seed-${now}-${i}`,
    messageId: 1000 + i,
    channelId: 'demo',
    channelTitle: 'Demo kanal',
    channelUrl: 'https://t.me/demo',
    originalText: p.text,
    normalizedText: p.text.toLowerCase(),
    route: p.route,
    passengerCount: 2,
    phone: p.phone,
    username: null,
    classification: 'passenger',
    confidence: 0.9,
    duplicateFingerprint: p.text.slice(0, 20),
    isDuplicate: false,
    messageDate: new Date(now - i * 60000).toISOString(),
    collectedAt: new Date(now - i * 60000).toISOString(),
  }));
}

function readLocal(): Post[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) return JSON.parse(raw) as Post[];
  } catch {
    /* ignore */
  }
  const seeded = samplePosts();
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

interface PostsContextType {
  posts: Post[];
  newPost: Post | null;
  botConfigured: boolean;
  removePost: (id: string) => void;
  setPosts: (posts: Post[]) => void;
  refresh: () => void;
}

const PostsContext = createContext<PostsContextType>({
  posts: [],
  newPost: null,
  botConfigured: false,
  removePost: () => {},
  setPosts: () => {},
  refresh: () => {},
});

export function usePosts() {
  return useContext(PostsContext);
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<Post | null>(null);
  const [botConfigured, setBotConfigured] = useState(false);

  const isDuplicate = (list: Post[], p: Post): boolean => {
    if (p.phone && list.some((x) => x.phone === p.phone)) return true;
    if (p.duplicateFingerprint && list.some((x) => x.duplicateFingerprint === p.duplicateFingerprint)) return true;
    return false;
  };

  useEffect(() => {
    let active = true;

    // Initial load from backend (real posts). Fall back to local demo if offline.
    api<Post[]>('/api/posts')
      .then((res) => {
        if (active && res.ok) {
          setPosts(res.data);
          setBotConfigured(true);
        } else if (active) {
          setPosts(readLocal());
        }
      })
      .catch(() => {
        if (active) setPosts(readLocal());
      });

    // Telegram connection status
    api<{ telegram: boolean }>('/api/health')
      .then((res) => {
        if (active && res.ok) setBotConfigured(res.data.telegram);
      })
      .catch(() => {});

    // Real-time posts via Socket.IO
    const API_URL = import.meta.env.VITE_API_URL || '';
    const socket: Socket = io(API_URL || undefined, { transports: ['websocket', 'polling'] });

    socket.on('new-post', (incoming: Post) => {
      setPosts((prev) => {
        if (isDuplicate(prev, incoming)) return prev;
        return [incoming, ...prev].slice(0, 200);
      });
      setNewPost(incoming);
    });

    socket.on('remove-post', (id: string) => {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    });

    socket.on('connect', () => setBotConfigured(true));
    socket.on('disconnect', () => setBotConfigured(false));

    return () => {
      active = false;
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removePost = async (id: string) => {
    // Optimistic local removal + backend delete
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiAdmin(`/api/posts/${id}`, { method: 'DELETE' });
    } catch {
      /* backend may be offline; local removal persists for the session */
    }
  };

  const setPostsExternal = (next: Post[]) => {
    setPosts(next.slice(0, 200));
  };

  const refresh = () => {
    api<Post[]>('/api/posts')
      .then((res) => {
        if (res.ok) setPosts(res.data);
      })
      .catch(() => {});
  };

  return (
    <PostsContext.Provider value={{ posts, newPost, botConfigured, removePost, setPosts: setPostsExternal, refresh }}>
      {children}
      <NewPostToast post={newPost} />
    </PostsContext.Provider>
  );
}

function NewPostToast({ post }: { post: Post | null }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Post | null>(null);

  useEffect(() => {
    if (!post) return;
    setCurrent(post);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [post]);

  if (!visible || !current) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--accent)] text-white px-4 py-3 rounded-xl shadow-lg max-w-sm w-[90%]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs opacity-80">🔔 Yangi e'lon</p>
          <p className="text-sm font-medium whitespace-pre-wrap">{current.originalText}</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-white/80 text-sm leading-none">✕</button>
      </div>
    </div>
  );
}

