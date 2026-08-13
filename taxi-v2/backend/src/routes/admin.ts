import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAdminKey, publicUser } from '../middleware/auth';
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getPosts,
  getChannels,
} from '../services/storage';
import { User } from '../types';

const router = Router();

// List users
router.get('/users', requireAdminKey, (req: Request, res: Response) => {
  res.json({ ok: true, data: getUsers().map(publicUser) });
});

// Create user (with subscription)
router.post('/users', requireAdminKey, (req: Request, res: Response) => {
  const { login, password, name, role, telegramId, monthlyPrice, subscriptionEnd, status } = req.body || {};
  if (!login || !password) return res.status(400).json({ ok: false, error: 'login va parol kerak' });
  const now = new Date();
  const end = subscriptionEnd ? new Date(subscriptionEnd) : new Date(now.getTime() + 30 * 864e5);
  const user: User = {
    id: 'u-' + Date.now(),
    name: name || login,
    telegramId: Number(telegramId) || 0,
    login,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role === 'admin' ? 'admin' : 'user',
    status: status === 'blocked' ? 'blocked' : 'active',
    monthlyPrice: Number(monthlyPrice) || 50000,
    subscriptionStart: now.toISOString(),
    subscriptionEnd: end.toISOString(),
    settings: { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  addUser(user);
  res.json({ ok: true, data: publicUser(user) });
});

// Update user (subscription / role / status)
router.patch('/users/:id', requireAdminKey, (req: Request, res: Response) => {
  const { status, role, subscriptionEnd, monthlyPrice } = req.body || {};
  const updates: any = {};
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (subscriptionEnd) updates.subscriptionEnd = new Date(subscriptionEnd).toISOString();
  if (monthlyPrice) updates.monthlyPrice = Number(monthlyPrice);
  updates.updatedAt = new Date().toISOString();
  const u = updateUser(req.params.id, updates);
  if (!u) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  res.json({ ok: true, data: publicUser(u) });
});

router.delete('/users/:id', requireAdminKey, (req: Request, res: Response) => {
  deleteUser(req.params.id);
  res.json({ ok: true });
});

// Stats
router.get('/stats', requireAdminKey, (req: Request, res: Response) => {
  res.json({
    ok: true,
    data: {
      users: getUsers().length,
      posts: getPosts().length,
      channels: getChannels().length,
    },
  });
});

export default router;
