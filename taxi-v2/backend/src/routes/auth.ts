import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  getUserByLogin,
  getUserByTelegramId,
} from '../services/storage';
import { isSubscriptionActive } from '../middleware/auth';
import { generateToken, publicUser } from '../middleware/auth';

const router = Router();

// Login via login + password (task #6)
router.post('/login', (req: Request, res: Response) => {
  const { login, password } = req.body || {};
  if (!login || !password) return res.status(400).json({ ok: false, error: 'login va parol kerak' });
  const user = getUserByLogin(login);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ ok: false, error: 'Login yoki parol noto\'g\'ri' });
  }
  if (user.status === 'blocked') return res.status(403).json({ ok: false, error: 'Hisob bloklangan' });
  if (!isSubscriptionActive(user.id)) {
    return res.status(403).json({ ok: false, error: 'Obuna muddati tugagan' });
  }
  const token = generateToken(user.id);
  res.json({ ok: true, token, user: publicUser(user) });
});

// Login via Telegram ID (Mini App) (task #6)
router.post('/telegram', (req: Request, res: Response) => {
  const { telegramId, initData } = req.body || {};
  const tid = Number(telegramId);
  if (!tid) return res.status(400).json({ ok: false, error: 'telegramId kerak' });
  const user = getUserByTelegramId(tid);
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });
  if (user.status === 'blocked') return res.status(403).json({ ok: false, error: 'Hisob bloklangan' });
  if (!isSubscriptionActive(user.id)) {
    return res.status(403).json({ ok: false, error: 'Obuna muddati tugagan' });
  }
  const token = generateToken(user.id);
  res.json({ ok: true, token, user: publicUser(user) });
});

export default router;
