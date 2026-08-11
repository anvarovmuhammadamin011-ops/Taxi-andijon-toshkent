import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { loadAll } from './services/storage';
import { telegramCollector } from './services/telegram';
import { socketService } from './services/socket';
import { authRouter } from './routes/auth';
import { postsRouter } from './routes/posts';
import { adminRouter } from './routes/admin';

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
  app.use('/api/admin', adminRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', telegram: telegramCollector.isConnected() });
  });

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
