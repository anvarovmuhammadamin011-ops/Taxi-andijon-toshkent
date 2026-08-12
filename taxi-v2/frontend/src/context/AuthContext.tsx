import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Post, UserSettings, UserNotification } from '../lib/types';
import * as localAuth from '../lib/localAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  register: (name: string, login: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  savedPosts: Post[];
  savedIds: string[];
  toggleSaved: (post: Post) => void;
  notifications: UserNotification[];
  unreadNotifications: number;
  markNotificationsRead: () => void;
  pushNotification: (post: Post) => void;
  refreshMe: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: () => {},
  updateSettings: () => {},
  savedPosts: [],
  savedIds: [],
  toggleSaved: () => {},
  notifications: [],
  unreadNotifications: 0,
  markNotificationsRead: () => {},
  pushNotification: () => {},
  refreshMe: () => {},
  allUsers: [],
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
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const applyDarkMode = (dark: boolean) => {
    document.documentElement.classList.toggle('dark', dark);
  };

  const refreshLocal = () => {
    const u = localAuth.getCurrentUser();
    setUser(u);
    setAllUsers(localAuth.getAllUsers());
    if (u) {
      const sp = localAuth.getSavedPosts(u.id);
      setSavedPosts(sp);
      setSavedIds(sp.map((p) => p.id));
      const nf = localAuth.getNotifications(u.id);
      setNotifications(nf);
      setUnreadNotifications(nf.filter((n) => !n.read).length);
      applyDarkMode(u?.settings?.darkMode ?? false);
    } else {
      setSavedPosts([]);
      setSavedIds([]);
      setNotifications([]);
      setUnreadNotifications(0);
    }
  };

  useEffect(() => {
    refreshLocal();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (login: string, password: string) => {
    const res = localAuth.loginUser(login, password);
    if (res.ok && res.user) {
      setUser(res.user);
      applyDarkMode(res.user?.settings?.darkMode ?? false);
      refreshLocal();
      return { ok: true, user: res.user };
    }
    return { ok: false, error: res.error };
  };

  const register = async (name: string, loginValue: string, password: string) => {
    const res = localAuth.registerUser(name, loginValue, password);
    if (!res.ok) return { ok: false, error: res.error };
    return login(loginValue, password);
  };

  const logout = () => {
    localAuth.logoutUser();
    setUser(null);
    setSavedPosts([]);
    setSavedIds([]);
    setNotifications([]);
    setUnreadNotifications(0);
    setAllUsers(localAuth.getAllUsers());
    applyDarkMode(false);
  };

  const updateSettings = (s: Partial<UserSettings>) => {
    if (!user) return;
    const updated = localAuth.updateUserSettings(user.id, s);
    if (updated) {
      setUser(updated);
      applyDarkMode(updated.settings.darkMode);
    }
  };

  const toggleSaved = (post: Post) => {
    if (!user) return;
    const { posts, saved } = localAuth.toggleSavedPost(user.id, post);
    setSavedPosts(posts);
    setSavedIds(posts.map((p) => p.id));
    void saved;
  };

  const markNotificationsRead = () => {
    if (!user) return;
    const nf = localAuth.markNotificationsRead(user.id);
    setNotifications(nf);
    setUnreadNotifications(0);
  };

  const pushNotification = (post: Post) => {
    if (!user || !user.settings.notifications) return;
    const notif: UserNotification = {
      id: 'n-' + post.id,
      userId: user.id,
      postId: post.id,
      route: post.route as UserNotification['route'],
      passengerCount: post.passengerCount,
      text: post.originalText,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const nf = localAuth.addNotification(user.id, notif);
    setNotifications(nf);
    setUnreadNotifications(nf.filter((n) => !n.read).length);
  };

  const refreshMe = () => {
    refreshLocal();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateSettings,
        savedPosts,
        savedIds,
        toggleSaved,
        notifications,
        unreadNotifications,
        markNotificationsRead,
        pushNotification,
        refreshMe,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
