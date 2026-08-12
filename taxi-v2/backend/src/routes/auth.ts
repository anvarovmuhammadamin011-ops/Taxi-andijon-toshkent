import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { validateTelegramInitData, generateToken } from '../utils/telegram';
import { getUserByLogin, getUserByTelegramId, getUsers, addUser, updateUser } from '../services/storage';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password, initData } = req.body;

    if (!login || !password) {
      return res.status(400).json({ ok: false, error: 'Login and password required' });
    }

    // Validate Telegram initData server-side (browser login bypass for preview mode)
    const browserLogin = config.server.allowBrowserLogin && (!initData || initData === '');
    let telegramAuth: { isValid: boolean; userId: number | null; username: string | null } | null = null;

    if (browserLogin) {
      telegramAuth = { isValid: true, userId: null, username: null };
    } else {
      if (!initData) {
        return res.status(400).json({ ok: false, error: 'Login, password and initData required' });
      }
      telegramAuth = validateTelegramInitData(initData);
      if (!telegramAuth.isValid || !telegramAuth.userId) {
        return res.status(401).json({ ok: false, error: 'Invalid Telegram data' });
      }
    }

    // Check admin login
    if (login === config.admin.username && password === config.admin.password) {
      const token = generateToken({ userId: 'admin', telegramId: telegramAuth.userId || 0, role: 'admin' });
      return res.json({
        ok: true,
        token,
        user: { id: 'admin', name: 'Admin', role: 'admin', telegramId: telegramAuth.userId || 0 },
      });
    }

    // Find user by login
    const user = getUserByLogin(login);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Login yoki parol noto\'g\'ri' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, error: 'Login yoki parol noto\'g\'ri' });
    }

    // Verify Telegram ID matches (skipped in browser login preview mode)
    if (!browserLogin && telegramAuth!.userId && user.telegramId !== telegramAuth!.userId) {
      return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan' });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ ok: false, error: 'Akkauntingiz vaqtincha bloklangan' });
    }

    // Check subscription
    const now = new Date();
    const endDate = new Date(user.subscriptionEnd);
    if (now > endDate) {
      updateUser(user.id, { status: 'expired' });
      return res.status(403).json({
        ok: false,
        error: 'Obuna muddati tugagan',
        subscriptionEnd: user.subscriptionEnd,
        monthlyPrice: user.monthlyPrice,
      });
    }

    // Generate token
    const token = generateToken({ userId: user.id, telegramId: user.telegramId, role: user.role });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        telegramId: user.telegramId,
        role: user.role,
        subscriptionEnd: user.subscriptionEnd,
        monthlyPrice: user.monthlyPrice,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req: Request, res: Response) => {
  // For admin
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { verifyToken } = await import('../utils/telegram');
    const payload = verifyToken(token);
    if (payload && payload.role === 'admin') {
      return res.json({
        ok: true,
        user: { id: 'admin', name: 'Admin', role: 'admin' },
      });
    }
  }
  res.status(401).json({ ok: false, error: 'Unauthorized' });
});

export { router as authRouter };
