import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? "change-me";
}

export function verifyPassword(password?: string): boolean {
  return Boolean(password) && password === process.env.ADMIN_PASSWORD;
}

export function createToken(): string {
  const payload = Buffer.from(String(Date.now() + TTL_MS)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token?: string): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(Buffer.from(payload, "base64url").toString());
  return Number.isFinite(exp) && exp > Date.now();
}
