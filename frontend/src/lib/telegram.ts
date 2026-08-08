declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: Record<string, unknown>;
        colorScheme: string;
        themeParams: Record<string, string>;
        platform: string;
        version: string;
        ready: () => void;
        expand: () => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface TelegramApi {
  isInTelegram: boolean;
  platform: string;
  init: () => void;
  haptic: (type: "light" | "medium" | "heavy") => void;
  notify: (type: "error" | "success" | "warning") => void;
  openChannel: (url: string) => void;
  call: (phone: string) => void;
  showBackButton: (cb: () => void) => void;
  hideBackButton: () => void;
  getUser: () => TelegramUser | null;
}

const webApp = () => window.Telegram?.WebApp;

export const telegram: TelegramApi = {
  get isInTelegram() {
    return Boolean(webApp());
  },
  get platform() {
    return webApp()?.platform ?? "web";
  },
  init() {
    const w = webApp();
    if (!w) return;
    w.ready();
    w.expand();
  },
  haptic(type) {
    try {
      webApp()?.HapticFeedback?.impactOccurred(type);
    } catch {
      /* noop */
    }
  },
  notify(type) {
    try {
      webApp()?.HapticFeedback?.notificationOccurred(type);
    } catch {
      /* noop */
    }
  },
  openChannel(url) {
    const w = webApp();
    if (w?.openTelegramLink) {
      w.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  },
  call(phone) {
    const href = `tel:${phone}`;
    window.location.href = href;
  },
  showBackButton(cb) {
    const b = webApp()?.BackButton;
    if (b) {
      b.onClick(cb);
      b.show();
    }
  },
  hideBackButton() {
    const b = webApp()?.BackButton;
    if (b) {
      b.hide();
    }
  },
  getUser() {
    const u = webApp()?.initDataUnsafe?.user as
      | { id: number; first_name?: string; last_name?: string; username?: string }
      | undefined;
    if (!u) return null;
    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
    };
  },
};

export {};
