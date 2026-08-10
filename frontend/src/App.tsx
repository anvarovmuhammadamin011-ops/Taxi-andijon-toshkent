import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { DataProvider, useData } from "./context/DataContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Splash from "./components/Splash";
import BottomNav from "./components/BottomNav";
import Paywall from "./components/Paywall";
import Home from "./pages/Home";
import RoutesPage from "./pages/Routes";
import Channels from "./pages/Channels";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import RouteFeed from "./pages/RouteFeed";
import ChannelFeed from "./pages/ChannelFeed";
import Vip from "./pages/Vip";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import AdminPanel from "./pages/admin/AdminPanel";
import Dashboard from "./pages/admin/Dashboard";
import AdminChannels from "./pages/admin/AdminChannels";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminVip from "./pages/admin/AdminVip";
import AdminBot from "./pages/admin/AdminBot";
import { telegram } from "./lib/telegram";

function Shell() {
  const { config } = useData();
  if (config.paywall?.enabled) {
    return <Paywall message={config.paywall.message} />;
  }
  return (
    <div className="app-glow mx-auto flex h-full max-w-md flex-col bg-bg">
      <main className="relative flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/route/:from/:to" element={<RouteFeed />} />
          <Route path="/channel/:id" element={<ChannelFeed />} />
          <Route path="/vip" element={<Vip />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/channels" element={<AdminChannels />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/posts" element={<AdminPosts />} />
          <Route path="/admin/vip" element={<AdminVip />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/bot" element={<AdminBot />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    telegram.init();
    const t1 = setTimeout(() => setSplashVisible(false), 1900);
    const t2 = setTimeout(() => setSplashMounted(false), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {splashMounted && (
              <div
                className={`transition-opacity duration-500 ${
                  splashVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <Splash />
              </div>
            )}
            <Shell />
          </HashRouter>
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
