import dotenv from 'dotenv';
dotenv.config();

function num(v: string | undefined, d: number): number {
  const n = parseInt(v || '', 10);
  return isNaN(n) ? d : n;
}

export const config = {
  server: {
    port: num(process.env.PORT, 3001),
    frontendUrls: (process.env.FRONTEND_URLS || 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    seedChannels: (process.env.SEED_CHANNELS || '')
      .split(',')
      .map((s) => s.trim().replace('@', ''))
      .filter(Boolean),
  },
  telegram: {
    apiId: num(process.env.API_ID, 0),
    apiHash: process.env.API_HASH || '',
    botToken: process.env.BOT_TOKEN || '',
    session: process.env.TELEGRAM_SESSION || '',
  },
  admin: {
    key: process.env.ADMIN_KEY || 'change_this_admin_key',
    telegramUsername: process.env.ADMIN_TELEGRAM_USERNAME || '',
  },
  storage: {
    dataDir: process.env.DATA_DIR || './data',
    maxPosts: num(process.env.MAX_POSTS, 65),
  },
};
