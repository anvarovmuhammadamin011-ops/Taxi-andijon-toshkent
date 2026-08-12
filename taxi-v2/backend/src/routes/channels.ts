import { Router, Request, Response } from 'express';
import { authenticateToken, authenticateAdmin } from '../middleware/auth';
import { getChannels, addChannel, updateChannel, deleteChannel } from '../services/storage';
import { Channel } from '../types';

const router = Router();

// GET /api/channels - Get all channels (public)
router.get('/', (req: Request, res: Response) => {
  const channels = getChannels();
  res.json({ ok: true, data: channels });
});

// POST /api/channels - Add new channel (admin only)
router.post('/', authenticateToken, authenticateAdmin, (req: Request, res: Response) => {
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

// PATCH /api/channels/:id - Update channel (admin only)
router.patch('/:id', authenticateToken, authenticateAdmin, (req: Request, res: Response) => {
  const { status, title } = req.body;
  const updates: Partial<Channel> = {};
  if (status) updates.status = status;
  if (title) updates.title = title;

  const channel = updateChannel(req.params.id, updates);
  if (!channel) return res.status(404).json({ ok: false, error: 'Channel not found' });
  res.json({ ok: true, data: channel });
});

// DELETE /api/channels/:id - Delete channel (admin only)
router.delete('/:id', authenticateToken, authenticateAdmin, (req: Request, res: Response) => {
  deleteChannel(req.params.id);
  res.json({ ok: true });
});

export { router as channelsRouter };
