import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  effective: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const KEY = "taxi_collector_theme";

function getSystem(): "light" | "dark" {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function loadMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* noop */
  }
  return "system";
}

function syncTelegram() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#0D1012";
  try {
    const w = window.Telegram?.WebApp;
    if (!w || !("version" in w) || parseFloat(String(w.version)) < 7) return;
    w.setHeaderColor?.(bg);
    w.setBackgroundColor?.(bg);
  } catch {
    /* older sdk */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadMode);
  const [system, setSystem] = useState<"light" | "dark">(getSystem);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const effective = mode === "system" ? system : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.dataset.theme = effective;
    root.style.colorScheme = effective;
    syncTelegram();
    const t = setTimeout(() => root.classList.remove("theme-transition"), 320);
    return () => clearTimeout(t);
  }, [effective]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<ThemeState>(() => ({ mode, effective, setMode }), [mode, effective, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
