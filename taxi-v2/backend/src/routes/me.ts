import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserById,
  updateUser,
  getPosts,
  getSavedPostIds,
  toggleSavedPost,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  clearNotifications,
} from '../services/storage';
import { UserSettings, Route, Language } from '../types';

const router = Router();
router.use(authenticateToken);

const VALID_ROUTES: Route[] = ['toshkent_andijon', 'andijon_toshkent'];
const VALID_LANGS: Language[] = ['uz', 'ru'];

// GET /api/me - Current user profile with settings, saved, notifications
router.get('/', (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

  const settings: UserSettings = {
    darkMode: user.settings?.darkMode ?? false,
    notifications: user.settings?.notifications ?? true,
    defaultRoute: user.settings?.defaultRoute ?? 'toshkent_andijon',
    language: user.settings?.language ?? 'uz',
  };

  const savedIds = getSavedPostIds(user.id);
  const posts = getPosts();
  const savedPosts = savedIds
    .map((id) => posts.find((p) => p.id === id && p.classification === 'passenger' && !p.isDuplicate))
    .filter(Boolean);

  const notifications = getNotifications(user.id);
  const unread = getUnreadNotificationCount(user.id);

  res.json({
    ok: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        telegramId: user.telegramId,
        role: user.role,
        status: user.status,
        monthlyPrice: user.monthlyPrice,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd,
        settings,
      },
      savedPosts,
      savedCount: savedPosts.length,
      notifications,
      unreadNotifications: unread,
    },
  });
});

// PATCH /api/me/settings - Update user settings
router.patch('/settings', (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

  const body = req.body || {};
  const current = user.settings || { darkMode: false, notifications: true, defaultRoute: 'toshkent_andijon', language: 'uz' };

  const next: UserSettings = {
    darkMode: typeof body.darkMode === 'boolean' ? body.darkMode : current.darkMode,
    notifications: typeof body.notifications === 'boolean' ? body.notifications : current.notifications,
    defaultRoute: VALID_ROUTES.includes(body.defaultRoute) ? body.defaultRoute : current.defaultRoute,
    language: VALID_LANGS.includes(body.language) ? body.language : current.language,
  };

  const updated = updateUser(user.id, { settings: next });
  res.json({ ok: true, data: { settings: next } });
});

// GET /api/me/saved - Saved posts
router.get('/saved', (req: Request, res: Response) => {
  const user = getUserById(req.user!.userId);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

  const savedIds = getSavedPostIds(user.id);
  const posts = getPosts();
  const savedPosts = savedIds
    .map((id) => posts.find((p) => p.id === id))
    .filter(Boolean) as any[];

  res.json({ ok: true, data: savedPosts, savedIds });
});

// POST /api/me/saved/:postId - Toggle saved post
router.post('/saved/:postId/toggle', (req: Request, res: Response) => {
  const result = toggleSavedPost(req.user!.userId, req.params.postId);
  res.json({ ok: true, data: result });
});

// GET /api/me/notifications - Notifications
router.get('/notifications', (req: Request, res: Response) => {
  const notifications = getNotifications(req.user!.userId);
  res.json({ ok: true, data: notifications });
});

// POST /api/me/notifications/read - Mark all read
router.post('/notifications/read', (req: Request, res: Response) => {
  markNotificationsRead(req.user!.userId);
  res.json({ ok: true });
});

// DELETE /api/me/notifications - Clear all
router.delete('/notifications', (req: Request, res: Response) => {
  clearNotifications(req.user!.userId);
  res.json({ ok: true });
});

export { router as meRouter };