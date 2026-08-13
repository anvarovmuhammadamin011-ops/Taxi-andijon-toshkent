import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function ts(): string {
  return new Date().toISOString();
}

export const logger = {
  info: (...a: any[]) => console.log(`[${ts()}] INFO:`, ...a),
  warn: (...a: any[]) => console.warn(`[${ts()}] WARN:`, ...a),
  error: (...a: any[]) => console.error(`[${ts()}] ERROR:`, ...(a as any[])),
  debug: (...a: any[]) => {
    if (process.env.DEBUG) console.log(`[${ts()}] DEBUG:`, ...a);
  },
};
