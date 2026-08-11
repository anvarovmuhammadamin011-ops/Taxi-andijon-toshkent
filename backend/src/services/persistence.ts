import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const LOCAL_DIR = join(__dirname, "..", "..", "data");
const LOCAL_FILE = join(LOCAL_DIR, "db.json");
const KV_KEY = "taxi:db";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const useKv = Boolean(KV_URL && KV_TOKEN);

async function kvGet(): Promise<string | null> {
  try {
    const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { result: string | null };
    return j.result;
  } catch (e) {
    console.error("KV o'qishda xato:", e);
    return null;
  }
}

async function kvSet(value: string): Promise<boolean> {
  try {
    const res = await fetch(`${KV_URL}/set/${KV_KEY}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: value,
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (e) {
    console.error("KV yozishda xato:", e);
    return false;
  }
}

function loadLocal(): string | null {
  try {
    if (existsSync(LOCAL_FILE)) return readFileSync(LOCAL_FILE, "utf8");
  } catch (e) {
    console.error("db.json o'qishda xato:", e);
  }
  return null;
}

function saveLocal(content: string): void {
  try {
    if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
    writeFileSync(LOCAL_FILE, content);
  } catch (e) {
    console.error("db.json yozishda xato:", e);
  }
}

export async function loadDbAsync<T>(): Promise<T | null> {
  if (useKv) {
    const s = await kvGet();
    if (s) {
      try {
        return JSON.parse(s) as T;
      } catch (e) {
        console.error("KV db parse xato:", e);
      }
    }
  }
  const local = loadLocal();
  if (local) {
    try {
      return JSON.parse(local) as T;
    } catch (e) {
      console.error("local db parse xato:", e);
    }
  }
  return null;
}

export function saveDb<T>(data: T): void {
  const content = JSON.stringify(data);
  saveLocal(content);
  if (useKv) {
    kvSet(content).catch(() => undefined);
  }
}