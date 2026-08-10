import { AppConfig, AppUser, Channel, DashboardStats, DeliveryConfig, DeliveryTarget, DeliveryTask, IncomingResult, Post, RevenueStats, RouteInfo } from "../types";
import { getAdminToken } from "./adminAuth";
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

function adminInit(method: string, body?: unknown): RequestInit {
  const token = getAdminToken();
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-token": token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
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
    const token = getAdminToken();
    const headers: Record<string, string> = {};
    if (token) headers["x-admin-token"] = token;
    const r = await request<AppConfig>("/api/config", { headers });
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

  admin: {
    login: (password: string) =>
      request<{ token: string }>("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
    logout: () => request<{ ok: boolean }>("/api/admin/logout", adminInit("POST")),
    dashboard: () => request<DashboardStats>("/api/admin/dashboard", adminInit("GET")),
    channels: () => request<Channel[]>("/api/admin/channels", adminInit("GET")),
    addChannel: (title: string, url: string) =>
      request<Channel>("/api/admin/channels", adminInit("POST", { title, url })),
    toggleChannel: (id: string, isActive: boolean) =>
      request<Channel>(`/api/admin/channels/${id}`, adminInit("PATCH", { isActive })),
    deleteChannel: (id: string) => request<{ ok: boolean }>(`/api/admin/channels/${id}`, adminInit("DELETE")),
    users: () => request<AppUser[]>("/api/admin/users", adminInit("GET")),
    blockUser: (id: string, isBlocked: boolean) =>
      request<AppUser>(`/api/admin/users/${id}`, adminInit("PATCH", { isBlocked })),
    posts: (q = "") => request<Post[]>(`/api/admin/posts${q ? `?q=${encodeURIComponent(q)}` : ""}`, adminInit("GET")),
    deletePost: (id: string) => request<{ ok: boolean }>(`/api/admin/posts/${id}`, adminInit("DELETE")),
    revenue: () => request<RevenueStats>("/api/admin/revenue", adminInit("GET")),
    keywords: () => request<string[]>("/api/admin/keywords", adminInit("GET")),
    addKeyword: (keyword: string) => request<string[]>("/api/admin/keywords", adminInit("POST", { keyword })),
    removeKeyword: (kw: string) => request<string[]>(`/api/admin/keywords/${encodeURIComponent(kw)}`, adminInit("DELETE")),
    setLimit: (postLimit: number) => request<{ postLimit: number }>("/api/admin/config", adminInit("PATCH", { postLimit })),
    simulate: () => request<IncomingResult>("/api/admin/simulate", adminInit("POST")),
    deliveryTargets: () => request<DeliveryTarget[]>("/api/admin/delivery/targets", adminInit("GET")),
    addDeliveryTarget: (body: { telegramId: number; channelUsername: string; channelTitle?: string; tier: string }) =>
      request<DeliveryTarget>("/api/admin/delivery/targets", adminInit("POST", body)),
    updateDeliveryTarget: (id: string, body: Partial<DeliveryTarget>) =>
      request<DeliveryTarget>(`/api/admin/delivery/targets/${id}`, adminInit("PATCH", body)),
    deleteDeliveryTarget: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/delivery/targets/${id}`, adminInit("DELETE")),
    testDeliveryTarget: (id: string) =>
      request<{ ok: boolean; error?: string }>(`/api/admin/delivery/targets/${id}/test`, adminInit("POST")),
    deliveryTasks: () => request<DeliveryTask[]>("/api/admin/delivery/tasks", adminInit("GET")),
    sendTaskNow: (id: string) => request<DeliveryTask>(`/api/admin/delivery/tasks/${id}/send`, adminInit("PATCH")),
    clearFinishedTasks: () => request<{ ok: boolean }>("/api/admin/delivery/tasks/finished", adminInit("DELETE")),
    deliveryConfig: () => request<DeliveryConfig>("/api/admin/delivery/config", adminInit("GET")),
    setDeliveryConfig: (body: Partial<DeliveryConfig>) =>
      request<DeliveryConfig>("/api/admin/delivery/config", adminInit("PATCH", body)),
  },
};
