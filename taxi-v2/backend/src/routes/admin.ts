import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, authenticateAdmin } from '../middleware/auth';
import { getUsers, getUserById, addUser, updateUser, deleteUser, getChannels, addChannel, updateChannel, deleteChannel, getPosts, getSettings, updateSettings } from '../services/storage';
import { Channel } from '../types';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);
router.use(authenticateAdmin);

// GET /api/admin/stats - Dashboard stats
router.get('/stats', (req: Request, res: Response) => {
  const users = getUsers();
  const posts = getPosts();
  const channels = getChannels();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  res.json({
    ok: true,
    data: {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      expiredUsers: users.filter((u) => u.status === 'expired').length,
      blockedUsers: users.filter((u) => u.status === 'blocked').length,
      activeChannels: channels.filter((c) => c.status === 'active').length,
      totalChannels: channels.length,
      currentPosts: posts.filter((p) => p.classification === 'passenger' && !p.isDuplicate).length,
      maxPosts: 65,
      passengerPostsToday: posts.filter((p) => p.classification === 'passenger' && new Date(p.collectedAt) >= today).length,
      driverPostsToday: posts.filter((p) => p.classification === 'driver' && new Date(p.collectedAt) >= today).length,
    },
  });
});

// GET /api/admin/users - All users
router.get('/users', (req: Request, res: Response) => {
  const users = getUsers().map((u) => ({ ...u, passwordHash: undefined }));
  res.json({ ok: true, data: users });
});

// POST /api/admin/users - Create user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { name, telegramId, login, password, monthlyPrice, subscriptionMonths } = req.body;

    if (!name || !telegramId || !login || !password) {
      return res.status(400).json({ ok: false, error: 'All fields required' });
    }

    const existingUser = getUsers().find((u) => u.login === login || u.telegramId === telegramId);
    if (existingUser) {
      return res.status(400).json({ ok: false, error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (subscriptionMonths || 1));

    const user = {
      id: Date.now().toString(),
      name,
      telegramId,
      login,
      passwordHash,
      role: 'user' as const,
      status: 'active' as const,
      monthlyPrice: monthlyPrice || 50000,
      subscriptionStart: startDate.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
    };

    addUser(user);
    res.json({ ok: true, data: { ...user, passwordHash: undefined } });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id - Update user
router.patch('/users/:id', (req: Request, res: Response) => {
  const updates = req.body;
  const user = updateUser(req.params.id, updates);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
  res.json({ ok: true, data: { ...user, passwordHash: undefined } });
});

// POST /api/admin/users/:id/extend - Extend subscription
router.post('/users/:id/extend', (req: Request, res: Response) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

  const now = new Date();
  const currentEnd = new Date(user.subscriptionEnd);
  const baseDate = currentEnd > now ? currentEnd : now;
  const newEnd = new Date(baseDate);
  newEnd.setMonth(newEnd.getMonth() + 1);

  const updated = updateUser(user.id, {
    subscriptionEnd: newEnd.toISOString(),
    status: 'active',
  });

  res.json({ ok: true, data: { ...updated, passwordHash: undefined } });
});

// POST /api/admin/users/:id/block - Block/unblock user
router.post('/users/:id/block', (req: Request, res: Response) => {
  const { blocked } = req.body;
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

  const updated = updateUser(user.id, {
    status: blocked ? 'blocked' : 'active',
  });

  res.json({ ok: true, data: { ...updated, passwordHash: undefined } });
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', (req: Request, res: Response) => {
  deleteUser(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/channels - All channels
router.get('/channels', (req: Request, res: Response) => {
  res.json({ ok: true, data: getChannels() });
});

// POST /api/admin/channels - Add channel
router.post('/channels', (req: Request, res: Response) => {
  const { username, title, channelId } = req.body;
  if (!username) return res.status(400).json({ ok: false, error: 'Username required' });

  const existing = getChannels().find((c) => c.username === username);
  if (existing) return res.status(400).json({ ok: false, error: 'Channel already exists' });

  const channel: Channel = {
    id: Date.now().toString(),
    channelId: channelId || username,
    username,
    title: title || username,
    url: `https://t.me/${username}`,
    status: 'active',
    lastProcessedMessageId: 0,
    lastEventTime: null,
    totalCollectedPosts: 0,
    totalPassengerPosts: 0,
    totalDriverPosts: 0,
    addedAt: new Date().toISOString(),
  };

  addChannel(channel);
  res.json({ ok: true, data: channel });
});

// PATCH /api/admin/channels/:id - Update channel
router.patch('/channels/:id', (req: Request, res: Response) => {
  const { status, title } = req.body;
  const updates: Partial<Channel> = {};
  if (status) updates.status = status;
  if (title) updates.title = title;

  const channel = updateChannel(req.params.id, updates);
  if (!channel) return res.status(404).json({ ok: false, error: 'Channel not found' });
  res.json({ ok: true, data: channel });
});

// DELETE /api/admin/channels/:id - Delete channel
router.delete('/channels/:id', (req: Request, res: Response) => {
  deleteChannel(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/posts - All posts
router.get('/posts', (req: Request, res: Response) => {
  res.json({ ok: true, data: getPosts() });
});

// GET /api/admin/settings - Get settings
router.get('/settings', (req: Request, res: Response) => {
  res.json({ ok: true, data: getSettings() });
});

// PATCH /api/admin/settings - Update settings
router.patch('/settings', (req: Request, res: Response) => {
  const settings = updateSettings(req.body);
  res.json({ ok: true, data: settings });
});

export { router as adminRouter };
