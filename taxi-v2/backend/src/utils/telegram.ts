import CryptoJS from 'crypto-js';
import { config } from '../config';

// Validate Telegram Mini App initData server-side
export function validateTelegramInitData(initData: string): { isValid: boolean; userId: number | null; username: string | null } {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return { isValid: false, userId: null, username: null };

    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Generate secret key from bot token
    const secretKey = CryptoJS.HmacSHA256(config.telegram.botToken || '', 'WebAppData');
    const computedHash = CryptoJS.HmacSHA256(dataCheckString, secretKey).toString(CryptoJS.enc.Hex);

    if (computedHash !== hash) {
      return { isValid: false, userId: null, username: null };
    }

    const userParam = urlParams.get('user');
    if (!userParam) return { isValid: true, userId: null, username: null };

    const user = JSON.parse(userParam);
    return {
      isValid: true,
      userId: user.id || null,
      username: user.username || null,
    };
  } catch {
    return { isValid: false, userId: null, username: null };
  }
}

// Generate a simple token (in production use JWT)
export function generateToken(payload: { userId: string; telegramId: number; role: string }): string {
  const data = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(data, config.server.jwtSecret).toString();
}

export function verifyToken(token: string): { userId: string; telegramId: number; role: string } | null {
  try {
    const bytes = CryptoJS.AES.decrypt(token, config.server.jwtSecret);
    const data = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(data);
  } catch {
    return null;
  }
}
