import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { logger } from './utils/logger';
import { loadAll } from './services/storage';
import { telegramCollector } from './services/telegram';
import { socketService } from './services/socket';

import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import channelsRouter from './routes/channels';
import adminRouter from './routes/admin';
import meRouter from './routes/me';

loadAll();

const app = express();
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.server.frontendUrls, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Real-time: broadcast new passenger posts to the Mini App (task #5)
telegramCollector.onPost((post) => {
  socketService.broadcastNewPost(post);
});

// Routes (task #9: server API for everything)
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/me', meRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', telegram: telegramCollector.isConnected() });
});

// Serve built frontend (optional single-service deploy)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
  logger.info(`Serving frontend from ${frontendDist}`);
}

const httpServer = createServer(app);
socketService.initialize(httpServer, config.server.frontendUrls);

// Connect Telegram (tasks #1-5)
telegramCollector.connect().catch((e) => logger.error('Telegram connect error', e));

httpServer.listen(config.server.port, () => {
  logger.info(`Server running on port ${config.server.port}`);
});
