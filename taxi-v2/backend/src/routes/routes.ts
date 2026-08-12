import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/routes - Available routes (public)
router.get('/', (req: Request, res: Response) => {
  res.json({
    ok: true,
    data: [
      { id: 'toshkent_andijon', label: 'Toshkent → Andijon', icon: '🕐' },
      { id: 'andijon_toshkent', label: 'Andijon → Toshkent', icon: '🕐' },
    ],
  });
});

export { router as routesRouter };