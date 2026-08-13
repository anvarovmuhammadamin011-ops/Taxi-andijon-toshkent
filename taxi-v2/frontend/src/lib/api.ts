import { ADMIN_API_KEY } from './localAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

// Backend may return { ok, data, ... } OR a bare { data, ... } / array.
// Normalize so the frontend always sees { ok, data } (ok falls back to HTTP status).
function normalize<T>(res: Response, json: any): ApiResponse<T> {
  const ok = json && typeof json.ok === 'boolean' ? json.ok : res.ok;
  const data = json && json.data !== undefined ? json.data : json;
  return { ok, data, error: json?.error };
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return normalize<T>(res, json);
}

// Calls protected by the backend admin key (channel sync / management).
export async function apiAdmin<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_API_KEY,
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  return normalize<T>(res, json);
}