import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET || 'taxi-collector-secret-key-change-in-production',
    jwtExpiresIn: '30d',
  },
  telegram: {
    apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
    apiHash: process.env.TELEGRAM_API_HASH || '',
    session: process.env.TELEGRAM_SESSION || '',
    botToken: process.env.BOT_TOKEN || '',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    telegramUsername: process.env.ADMIN_TELEGRAM_USERNAME || '@admin',
  },
  storage: {
    dataDir: process.env.DATA_DIR || './data',
    maxPosts: 65,
  },
};

export function validateConfig(): void {
  if (!config.telegram.apiId || !config.telegram.apiHash) {
    console.warn('Telegram API credentials not configured');
  }
}
