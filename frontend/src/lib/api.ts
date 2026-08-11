import { AppConfig, Channel, Post, RouteInfo } from "../types";
import { telegram } from "./telegram";

export function userIdHeader(): Record<string, string> {
  const user = telegram.getUser();
  return user?.id ? { "x-user-id": String(user.id) } : {};
}

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 5000
): Promise<{ data: T; ok: boolean; error?: string; status?: number }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(path, { ...init, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      let error = String(res.status);
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) error = body.error;
      } catch {
        /* noop */
      }
      return { data: undefined as T, ok: false, error, status: res.status };
    }
    return { data: (await res.json()) as T, ok: true, status: res.status };
  } catch {
    return { data: undefined as T, ok: false, status: 0 };
  }
}

export const api = {
  posts: (q = "", route = "", since = "") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (route) params.set("route", route);
    if (since) params.set("since", since);
    const qs = params.toString();
    return request<Post[]>(`/api/posts${qs ? `?${qs}` : ""}`, { headers: userIdHeader() });
  },
  channels: () => request<Channel[]>("/api/channels", { headers: userIdHeader() }),
  routes: () => request<RouteInfo[]>("/api/routes", { headers: userIdHeader() }),
  deleteChannel: (id: string) =>
    request<{ ok: boolean }>(`/api/channels/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: userIdHeader(),
    }),
  addChannel: (link: string) =>
    request<Channel>(
      "/api/channels",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userIdHeader() },
        body: JSON.stringify({ link }),
      },
      15000
    ),
  config: async () => {
    const r = await request<AppConfig>("/api/config", { headers: userIdHeader() });
    if (r.ok && r.data) return r;
    return {
      ok: false,
      data: {
        cities: [],
        postLimit: 50,
        keywords: [],
        plans: [],
        isAdmin: false,
      },
    };
  },
};
