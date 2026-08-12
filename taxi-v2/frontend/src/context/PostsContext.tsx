import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Post } from '../lib/types';
import * as bot from '../lib/botCollector';

const POSTS_KEY = 'taxi_posts';

function samplePosts(): Post[] {
  const now = Date.now();
  const base: Array<Partial<Post> & { text: string; route: Post['route']; phone: string }> = [
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
    originalText: p.text!,
    normalizedText: p.text!.toLowerCase(),
    route: p.route!,
    passengerCount: 2,
    phone: p.phone!,
    username: null,
    classification: 'passenger',
    confidence: 0.9,
    duplicateFingerprint: p.text!.slice(0, 20),
    isDuplicate: false,
    messageDate: new Date(now - i * 60000).toISOString(),
    collectedAt: new Date(now - i * 60000).toISOString(),
  }));
}

function readPosts(): Post[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) return JSON.parse(raw) as Post[];
  } catch {
    /* ignore */
  }
  const seeded = samplePosts();
  localStorage.setItem(POSTS_KEY, JSON.stringify(seeded));
  return seeded;
}

function writePosts(posts: Post[]): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts.slice(0, 200)));
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
    setPosts(readPosts());
    setBotConfigured(bot.isBotConfigured());

    if (bot.isBotConfigured()) {
      bot.onNewPost((incoming) => {
        if (incoming.classification !== 'passenger') return;
        setPosts((prev) => {
          if (isDuplicate(prev, incoming)) return prev;
          const next = [incoming, ...prev].slice(0, 200);
          writePosts(next);
          return next;
        });
        setNewPost(incoming);
      });
      bot.startBotPolling();
    }

    return () => bot.stopBotPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removePost = (id: string) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writePosts(next);
      return next;
    });
  };

  const setPostsExternal = (next: Post[]) => {
    const sliced = next.slice(0, 200);
    writePosts(sliced);
    setPosts(sliced);
  };

  const refresh = () => setPosts(readPosts());

  return (
    <PostsContext.Provider value={{ posts, newPost, botConfigured, removePost, setPosts: setPostsExternal, refresh }}>
      {children}
    </PostsContext.Provider>
  );
}
