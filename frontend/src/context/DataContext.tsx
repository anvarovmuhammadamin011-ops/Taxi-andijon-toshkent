import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppConfig, Channel, IncomingResult, Post, RouteInfo, UserProfile } from "../types";
import { demoChannels, demoPosts, demoRoutes } from "../data/demo";
import { api } from "../lib/api";
import { telegram } from "../lib/telegram";

interface DataState {
  posts: Post[];
  channels: Channel[];
  routes: RouteInfo[];
  config: AppConfig;
  loading: boolean;
  usingDemo: boolean;
  refresh: () => Promise<void>;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  profile: UserProfile;
  newPosts: Post[];
  newPostsCount: number;
  showNewPosts: () => void;
  simulateNewPost: () => Promise<IncomingResult | null>;
  getPost: (id: string) => Post | undefined;
}

const DataContext = createContext<DataState | null>(null);

const FAV_KEY = "taxi_collector_favorites";
const PROFILE_KEY = "taxi_collector_profile";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function defaultProfile(isAdmin: boolean): UserProfile {
  const tg = telegram.getUser();
  const now = new Date();
  const vipUntil = new Date(now.getTime() + 55 * 86_400_000).toISOString();
  return {
    id: tg ? String(tg.id) : "demo-user",
    name: tg ? [tg.firstName, tg.lastName].filter(Boolean).join(" ") || "Foydalanuvchi" : "Muhammadamin",
    username: tg?.username ?? (tg ? undefined : "muhammadamin"),
    isAdmin,
    isVip: true,
    vipUntil,
    favoritesCount: 0,
  };
}

async function safeFetch<T>(url: string, fallback: T): Promise<{ data: T; ok: boolean }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(String(res.status));
    return { data: (await res.json()) as T, ok: true };
  } catch {
    return { data: fallback, ok: false };
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(demoPosts);
  const [channels, setChannels] = useState<Channel[]>(demoChannels);
  const [routes, setRoutes] = useState<RouteInfo[]>(demoRoutes);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const lastSeenRef = useRef<string>("");
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile() ?? defaultProfile(false));
  const [config, setConfig] = useState<AppConfig>({
    cities: ["Toshkent", "Andijon", "Haqqulobod"],
    postLimit: 100,
    keywords: [],
    plans: [],
    isAdmin: false,
    paywall: { enabled: false, message: "" },
  });

  const persistFavorites = useCallback((set: Set<string>) => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
    } catch {
      /* noop */
    }
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistFavorites(next);
        setProfile((p) => ({ ...p, favoritesCount: next.size }));
        return next;
      });
    },
    [persistFavorites]
  );

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [p, c, r] = await Promise.all([
      safeFetch<Post[]>("/api/posts", demoPosts),
      safeFetch<Channel[]>("/api/channels", demoChannels),
      safeFetch<RouteInfo[]>("/api/routes", demoRoutes),
    ]);
    setPosts(p.data);
    setChannels(c.data);
    setRoutes(r.data);
    setUsingDemo(!(p.ok && c.ok && r.ok));
    if (p.data.length > 0) {
      lastSeenRef.current = p.data[0].postedAt;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void api.config().then((res) => {
      if (res.ok && res.data) setConfig(res.data);
      const isAdmin = res.data?.isAdmin ?? false;
      setProfile((prev) => {
        if (prev) return { ...prev, isAdmin };
        return defaultProfile(isAdmin);
      });
    });
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (usingDemo) return;
      const res = await api.posts("", "", lastSeenRef.current || undefined);
      if (res.ok && res.data.length > 0) {
        setNewPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...res.data.filter((p) => !seen.has(p.id)), ...prev].slice(0, 20);
        });
        const latest = res.data[0].postedAt;
        if (latest > lastSeenRef.current) lastSeenRef.current = latest;
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [usingDemo]);

  const showNewPosts = useCallback(() => {
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...newPosts.filter((p) => !seen.has(p.id)), ...prev];
    });
    setNewPosts([]);
  }, [newPosts]);

  const simulateNewPost = useCallback(async () => {
    const res = await api.admin.simulate();
    if (res.ok && res.data) {
      await refresh();
      return res.data;
    }
    return null;
  }, [refresh]);

  const getPost = useCallback((id: string) => posts.find((p) => p.id === id), [posts]);

  const value = useMemo<DataState>(
    () => ({
      posts,
      channels,
      routes,
      config,
      loading,
      usingDemo,
      refresh,
      favorites,
      toggleFavorite,
      isFavorite,
      profile,
      newPosts,
      newPostsCount: newPosts.length,
      showNewPosts,
      simulateNewPost,
      getPost,
    }),
    [
      posts,
      channels,
      routes,
      config,
      loading,
      usingDemo,
      refresh,
      favorites,
      toggleFavorite,
      isFavorite,
      profile,
      newPosts,
      showNewPosts,
      simulateNewPost,
      getPost,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
