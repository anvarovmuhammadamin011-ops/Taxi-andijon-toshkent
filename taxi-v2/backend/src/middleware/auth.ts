import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/telegram';
import { AuthPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Middleware to verify JWT token
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ ok: false, error: 'Invalid token' });
    return;
  }

  req.user = {
    userId: payload.userId,
    telegramId: payload.telegramId,
    role: payload.role as any,
  };
  next();
}

// Middleware to verify admin role
export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'Forbidden' });
    return;
  }
  next();
}

// Middleware to protect owner-only endpoints (channel sync / management) with a
// shared admin key. The key is ADMIN_API_KEY on the server; the frontend sends it
// via VITE_ADMIN_API_KEY. Keeping auth on the frontend means there is no backend
// user session, so we use a simple shared secret instead of JWT admin.
export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.header('x-admin-key');
  const expected = process.env.ADMIN_API_KEY || 'taxi-admin';
  if (!key || key !== expected) {
    res.status(401).json({ ok: false, error: 'Admin key required' });
    return;
  }
  next();
}
