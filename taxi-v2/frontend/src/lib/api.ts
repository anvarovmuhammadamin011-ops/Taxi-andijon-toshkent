import { localRequest } from './localBackend';

const API_URL = import.meta.env.VITE_API_URL || '';
const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true' || !API_URL;

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T;
  error?: string;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  if (LOCAL_MODE) {
    const res = await localRequest(path, options);
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return { ok: false, data: undefined as T, error: res.error };
    }
    return { ok: true, data: res.data as T };
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!data.ok && res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return data;
}