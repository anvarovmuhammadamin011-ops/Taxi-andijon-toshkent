import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { getUserById, updateUser } from '../services/storage';

// In-memory token store (token -> userId). For production use Redis/JWT.
const tokens = new Map<string, string>();

export function generateToken(userId: string): string {
  const t = crypto.randomBytes(32).toString('hex');
  tokens.set(t, userId);
  return t;
}

export function userIdFromToken(token?: string): string | null {
  if (!token) return null;
  return tokens.get(token) || null;
}

export function isSubscriptionActive(userId: string): boolean {
  const u = getUserById(userId);
  if (!u) return false;
  if (u.status === 'blocked') return false;
  const active = new Date(u.subscriptionEnd).getTime() > Date.now();
  if (!active && u.status !== 'expired') {
    updateUser(userId, { status: 'expired' });
  }
  return active;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const uid = userIdFromToken(token);
  if (!uid) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  if (!isSubscriptionActive(uid)) {
    res.status(403).json({ ok: false, error: 'Obuna muddati tugagan' });
    return;
  }
  req.userId = uid;
  next();
}

export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== config.admin.key) {
    res.status(403).json({ ok: false, error: 'Admin kaliti noto\'g\'ri' });
    return;
  }
  next();
}

// Strip sensitive fields before sending a user to the client (security task #8)
export function publicUser(u: any) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}
