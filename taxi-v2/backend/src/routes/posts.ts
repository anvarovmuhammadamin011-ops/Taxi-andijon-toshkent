import { Router, Request, Response } from 'express';
import { requireAdminKey } from '../middleware/auth';
import { getPosts, removePost } from '../services/storage';

const router = Router();

// GET /api/posts - Get active passenger posts (public; auth is handled on frontend)
router.get('/', (req: Request, res: Response) => {
  const posts = getPosts().filter((p) => p.classification === 'passenger' && !p.isDuplicate);
  res.json({ ok: true, data: posts });
});

// DELETE /api/posts/:id - Remove a post (admin only)
router.delete('/:id', requireAdminKey, (req: Request, res: Response) => {
  removePost(req.params.id);
  res.json({ ok: true });
});

export { router as postsRouter };
