import { Router, Request, Response } from 'express';
import { requireAdminKey } from '../middleware/auth';
import { getChannels, addChannel, updateChannel, deleteChannel } from '../services/storage';
import { telegramCollector } from '../services/telegram';
import { logger } from '../utils/logger';
import { Channel } from '../types';

const router = Router();

// List channels (public read)
router.get('/', (req: Request, res: Response) => {
  res.json({ ok: true, data: getChannels() });
});

// Add a channel via admin panel (task: channels added through admin) + backfill
router.post('/', requireAdminKey, async (req: Request, res: Response) => {
  const { username, title } = req.body || {};
  if (!username) return res.status(400).json({ ok: false, error: 'username kerak' });
  const existing = getChannels().find((c) => c.username === username);
  if (existing) return res.status(400).json({ ok: false, error: 'Kanal allaqachon mavjud' });

  // Resolve numeric channelId (works with bot or user client)
  const resolved = await telegramCollector.resolveChannel(username);
  const channelId = resolved?.channelId || username;
  const channelTitle = title || resolved?.title || username;

  // Join (user-session) so real-time updates flow
  telegramCollector.joinChannel(username).catch(() => {});

  const channel: Channel = {
    id: Date.now().toString(),
    channelId,
    username,
    title: channelTitle,
    url: `https://t.me/${String(username).replace('@', '')}`,
    status: 'active',
    lastProcessedMessageId: 0,
    lastEventTime: null,
    totalCollectedPosts: 0,
    totalPassengerPosts: 0,
    totalDriverPosts: 0,
    addedAt: new Date().toISOString(),
  };
  addChannel(channel);

  // Backfill recent posts (silent)
  const count = await telegramCollector.backfillChannel(username);

  res.json({ ok: true, data: channel, backfilled: count });
});

// Backfill ALL accessible channels for the last 7 days (admin trigger)
router.post('/backfill-all', requireAdminKey, async (req: Request, res: Response) => {
  const days = Number(req.body?.days) || 7;
  const result = await telegramCollector.backfillAll(days);
  res.json({ ok: true, ...result });
});

// Pause / resume
router.patch('/:id', requireAdminKey, (req: Request, res: Response) => {
  const { status } = req.body || {};
  const updates: Partial<Channel> = {};
  if (status === 'active' || status === 'paused') updates.status = status;
  const ch = updateChannel(req.params.id, updates);
  if (!ch) return res.status(404).json({ ok: false, error: 'Kanal topilmadi' });
  res.json({ ok: true, data: ch });
});

router.delete('/:id', requireAdminKey, (req: Request, res: Response) => {
  deleteChannel(req.params.id);
  res.json({ ok: true });
});

export default router;
