import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { User, Post, UserSettings, UserNotification } from '../lib/types';

interface MeData {
  user: User;
  savedPosts: Post[];
  savedCount: number;
  notifications: UserNotification[];
  unreadNotifications: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateSettings: (s: Partial<UserSettings>) => Promise<void>;
  savedPosts: Post[];
  savedIds: string[];
  toggleSaved: (postId: string) => Promise<void>;
  notifications: UserNotification[];
  unreadNotifications: number;
  markNotificationsRead: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
  updateSettings: async () => {},
  savedPosts: [],
  savedIds: [],
  toggleSaved: async () => {},
  notifications: [],
  unreadNotifications: 0,
  markNotificationsRead: async () => {},
  refreshMe: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const applyDarkMode = (dark: boolean) => {
    document.documentElement.classList.toggle('dark', dark);
  };

  const refreshMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await api<MeData>('/api/me');
    if (res.ok) {
      setUser(res.data.user);
      setSavedPosts(res.data.savedPosts);
      setSavedIds(res.data.savedPosts.map((p) => p.id));
      setNotifications(res.data.notifications);
      setUnreadNotifications(res.data.unreadNotifications);
      applyDarkMode(res.data.user.settings.darkMode);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      applyDarkMode(JSON.parse(savedUser).settings?.darkMode || false);
      refreshMe();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (login: string, password: string) => {
    try {
      const res = await api<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });

      if (res.ok) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        applyDarkMode(res.data.user.settings?.darkMode || false);
        return { ok: true };
      }

      return { ok: false, error: res.error };
    } catch (error) {
      return { ok: false, error: 'Server error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSavedPosts([]);
    setSavedIds([]);
    setNotifications([]);
    setUnreadNotifications(0);
    applyDarkMode(false);
  };

  const updateSettings = async (s: Partial<UserSettings>) => {
    const res = await api<{ settings: UserSettings }>('/api/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(s),
    });
    if (res.ok && user) {
      const next = { ...user, settings: res.data.settings };
      setUser(next);
      localStorage.setItem('user', JSON.stringify(next));
      applyDarkMode(res.data.settings.darkMode);
    }
  };

  const toggleSaved = async (postId: string) => {
    const res = await api<{ saved: boolean }>(`/api/me/saved/${postId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setSavedIds((prev) => (res.data.saved ? [...prev, postId] : prev.filter((id) => id !== postId)));
      await refreshMe();
    }
  };

  const markNotificationsRead = async () => {
    await api('/api/me/notifications/read', { method: 'POST', body: JSON.stringify({}) });
    setUnreadNotifications(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateSettings,
        savedPosts,
        savedIds,
        toggleSaved,
        notifications,
        unreadNotifications,
        markNotificationsRead,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}