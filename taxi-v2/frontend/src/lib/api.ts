const API_URL = import.meta.env.VITE_API_URL || '';
import { ADMIN_API_KEY } from './localAuth';

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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

// Calls protected by the backend admin key (channel sync / management).
export async function apiAdmin<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_API_KEY,
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  return res.json();
}