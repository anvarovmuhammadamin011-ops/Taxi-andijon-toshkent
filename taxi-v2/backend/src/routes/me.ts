import { Router, Response } from 'express';
import { AuthRequest, requireAuth, publicUser } from '../middleware/auth';
import {
  getUserById,
  updateUser,
  getSavedPostIds,
  toggleSavedPost,
  getPosts,
  getNotifications,
  markNotificationsRead,
  clearNotifications,
} from '../services/storage';

const router = Router();

// Current user
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const u = getUserById(req.userId!);
  res.json({ ok: true, data: publicUser(u) });
});

// Update settings
router.patch('/settings', requireAuth, (req: AuthRequest, res: Response) => {
  const { settings } = req.body || {};
  const u = updateUser(req.userId!, { settings } as any);
  res.json({ ok: true, data: publicUser(u) });
});

// Saved posts (full objects)
router.get('/saved', requireAuth, (req: AuthRequest, res: Response) => {
  const ids = getSavedPostIds(req.userId!);
  const posts = getPosts().filter((p) => ids.includes(p.id));
  res.json({ ok: true, data: posts });
});

router.post('/saved', requireAuth, (req: AuthRequest, res: Response) => {
  const { postId } = req.body || {};
  const r = toggleSavedPost(req.userId!, postId);
  res.json({ ok: true, saved: r.saved });
});

// Notifications
router.get('/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ ok: true, data: getNotifications(req.userId!) });
});
router.post('/notifications/read', requireAuth, (req: AuthRequest, res: Response) => {
  markNotificationsRead(req.userId!);
  res.json({ ok: true });
});
router.delete('/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  clearNotifications(req.userId!);
  res.json({ ok: true });
});

export default router;
