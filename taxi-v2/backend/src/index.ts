import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { loadAll } from './services/storage';
import { telegramCollector } from './services/telegram';
import { socketService } from './services/socket';
import { authRouter } from './routes/auth';
import { postsRouter } from './routes/posts';
import { channelsRouter } from './routes/channels';
import { adminRouter } from './routes/admin';
import { meRouter } from './routes/me';
import { routesRouter } from './routes/routes';

async function main() {
  logger.info('Starting Taxi Collector v2...');
  validateConfig();

  // Load data from JSON files
  loadAll();

  // Express app
  const app = express();
  const httpServer = createServer(app);

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: config.server.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '10kb' }));

  // Rate limiting
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use('/api/', limiter);

  // Socket.IO
  socketService.initialize(httpServer);

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/channels', channelsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/me', meRouter);
  app.use('/api/routes', routesRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', telegram: telegramCollector.isConnected() });
  });

  // Serve built frontend (single-service deploy)
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  const frontendIndex = path.join(frontendDist, 'index.html');
  if (fs.existsSync(frontendIndex)) {
    app.use(express.static(frontendDist));
    // SPA fallback - all non-API routes go to index.html
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
      res.sendFile(frontendIndex);
    });
    logger.info(`Serving frontend from ${frontendDist}`);
  } else {
    logger.warn('Frontend dist not found - API-only mode');
  }

  // Connect to Telegram
  await telegramCollector.connect();

  // Register post handler
  telegramCollector.onPost((post) => {
    socketService.broadcastNewPost(post);
  });

  // Start server
  httpServer.listen(config.server.port, () => {
    logger.info(`Server running on port ${config.server.port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await telegramCollector.disconnect();
    httpServer.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Failed to start:', error);
  process.exit(1);
});
