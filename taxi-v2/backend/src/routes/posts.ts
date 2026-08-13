import { Router, Request, Response } from 'express';
import { getPosts, removePost } from '../services/storage';
import { requireAdminKey } from '../middleware/auth';
import { telegramCollector } from '../services/telegram';
import { Post } from '../types';

const router = Router();

// GET /api/posts — public feed (task #9: all data from backend)
router.get('/', (req: Request, res: Response) => {
  const route = req.query.route as string | undefined;
  const type = req.query.type as string | undefined;
  let posts: Post[] = getPosts();
  if (route && route !== 'all') posts = posts.filter((p) => p.route === route);
  if (type && type !== 'all') posts = posts.filter((p) => p.classification === type);
  res.json({ ok: true, data: posts, max: 65 });
});

// DELETE /api/posts/:id — admin removes a post (task #7)
router.delete('/:id', requireAdminKey, (req: Request, res: Response) => {
  removePost(req.params.id);
  res.json({ ok: true });
});

// Debug: inject a synthetic passenger post (no Telegram needed) to test the pipeline
router.post('/debug-inject', (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const post: Post = {
    id: `debug_${Date.now()}`,
    messageId: Math.floor(Date.now() / 1000),
    channelId: 'debug',
    channelTitle: req.body?.channelTitle || 'Debug Kanal',
    channelUrl: '',
    originalText: req.body?.text || "Toshkentdan Andijonga 2 kishi, +998901234567",
    normalizedText: '',
    route: 'toshkent_andijon',
    passengerCount: 2,
    phone: '+998901234567',
    username: null,
    classification: 'passenger',
    confidence: 0.9,
    duplicateFingerprint: `debug_${Date.now()}`,
    isDuplicate: false,
    messageDate: now,
    collectedAt: now,
    mediaType: req.body?.mediaType || null,
    mediaUrl: req.body?.mediaUrl || null,
  };
  const { addPost } = require('../services/storage');
  addPost(post);
  telegramCollector.pushToHandlers(post);
  res.json({ ok: true, post });
});

export default router;
