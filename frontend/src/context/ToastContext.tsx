import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface Toast {
  id: number;
  text: string;
  icon?: string;
}

interface ToastState {
  show: (text: string, icon?: string) => void;
}

const ToastContext = createContext<ToastState | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (text: string, icon?: string) => {
      const id = ++seq;
      setToasts((prev) => [...prev.slice(-2), { id, text, icon }]);
      const t = setTimeout(() => dismiss(id), 2200);
      timers.current.set(id, t);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-6 pt-[max(env(safe-area-inset-top),16px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-[16px] bg-ink/90 px-4 py-3 text-[13px] font-semibold text-bg shadow-soft backdrop-blur-md animate-fade-in-up"
            role="status"
          >
            {t.icon && <span className="text-base">{t.icon}</span>}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
