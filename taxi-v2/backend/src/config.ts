import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

function num(v: string | undefined, d: number): number {
  const n = parseInt(v || '', 10);
  return isNaN(n) ? d : n;
}

// Fallback secret loader. Some hosting platforms don't reliably inject env vars
// from the blueprint, so we also read a secrets file baked into the image.
function loadSecretsFile(): Record<string, string> {
  try {
    const f = path.resolve(__dirname, '../config-secrets.json');
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return {};
  }
}
const SECRETS = loadSecretsFile();
function secret(name: string, d = ''): string {
  const fromEnv = (process.env[name] || '').trim();
  if (fromEnv) return fromEnv;
  const fromFile = (SECRETS[name] || d).toString().trim();
  return fromFile;
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
    apiId: num(secret('API_ID'), 0),
    apiHash: secret('API_HASH'),
    botToken: secret('BOT_TOKEN'),
    session: secret('TELEGRAM_SESSION'),
    webAppUrl: secret('WEB_APP_URL', 'https://taxi-andijon-toshkent.onrender.com/'),
  },
  admin: {
    key: secret('ADMIN_KEY', 'change_this_admin_key'),
    telegramUsername: secret('ADMIN_TELEGRAM_USERNAME'),
  },
  storage: {
    dataDir: process.env.DATA_DIR || './data',
    maxPosts: num(process.env.MAX_POSTS, 65),
  },
};
