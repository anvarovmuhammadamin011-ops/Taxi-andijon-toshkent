import { store } from "./store";
import type { Channel } from "../types";
import { classifyWithAI } from "./aiClassify";
import { pushNotifyPhone } from "./notify";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const MAX_ID = 2_097_152;
const BACKFILL_IDS = 3;
const NEW_PROBE_LIMIT = 6;
const SLEEP_MS = 40;
const FETCH_TIMEOUT_MS = 8000;

export function usernameFromUrl(url: string): string {
  return url
    .replace(/^https:\/\/t\.me\//, "")
    .replace(/^t\.me\//, "")
    .replace(/^@/, "")
    .trim();
}

export async function fetchChannelTitle(username: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://t.me/${encodeURIComponent(username)}`, {
      headers: { "User-Agent": UA, "Accept-Language": "uz,ru,en;q=0.8" },
      signal: ctrl.signal,
    });
    const html = await res.text();
    const meta =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ??
      html.match(/<title>([^<]+)<\/title>/i);
    if (!meta) return null;
    return decodeEntities(meta[1].trim()).replace(/\s+/g, " ");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)));
}

export function extractText(html: string): string | undefined {
  const tm = html.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (!tm) return undefined;
  const text = decodeEntities(
    tm[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return text || undefined;
}

export interface EmbedResult {
  found: boolean;
  text?: string;
  postedAt?: string;
  flood?: boolean;
}

export async function embedMessage(username: string, id: number): Promise<EmbedResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://t.me/${username}/${id}?embed=1&mode=tme`, {
      headers: { "User-Agent": UA, "Accept-Language": "uz,ru,en;q=0.8" },
      signal: ctrl.signal,
    });
    const html = await res.text();
    if (res.status !== 200 || html.includes("Too Many Requests") || html.includes("FLOOD_WAIT")) {
      return { found: false, flood: true };
    }
    if (html.includes("Post not found") || html.includes("tgme_widget_message_error")) {
      return { found: false };
    }
    const timeMatch = html.match(/datetime="([^"]+)"/);
    return {
      found: true,
      text: extractText(html),
      postedAt: timeMatch ? new Date(timeMatch[1]).toISOString() : new Date().toISOString(),
    };
  } catch {
    return { found: false, flood: true };
  } finally {
    clearTimeout(timer);
  }
}

async function findTop(username: string): Promise<number> {
  let highestFound = 0;
  for (let id = 1; id <= MAX_ID; id *= 2) {
    const r = await embedMessage(username, id);
    if (r.flood) await new Promise((res) => setTimeout(res, 1500));
    if (r.found) highestFound = id;
    await new Promise((res) => setTimeout(res, SLEEP_MS));
  }
  if (highestFound === 0) return 0;
  let lo = highestFound;
  let hi = highestFound * 2;
  if (hi > MAX_ID) hi = MAX_ID;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const r = await embedMessage(username, mid);
    if (r.flood) await new Promise((res) => setTimeout(res, 1500));
    if (r.found) lo = mid;
    else hi = mid - 1;
    await new Promise((res) => setTimeout(res, SLEEP_MS));
  }
  for (;;) {
    if (lo >= MAX_ID) break;
    const r = await embedMessage(username, lo + 1);
    if (r.flood) await new Promise((res) => setTimeout(res, 1500));
    if (!r.found) break;
    lo++;
    await new Promise((res) => setTimeout(res, SLEEP_MS));
  }
  return lo;
}

async function addIfText(ch: Channel, username: string, id: number): Promise<boolean> {
  const r = await embedMessage(username, id);
  if (r.flood) await new Promise((res) => setTimeout(res, 1500));
  if (r.found && r.text) {
    const kind = await classifyWithAI(r.text);
    if (kind !== "passenger") return false;
    const res = store.addMonitoredPost({
      channel: ch,
      text: r.text,
      messageId: id,
      postedAt: r.postedAt ?? new Date().toISOString(),
    });
    if (res && res.status === "new" && res.post) pushNotifyPhone(res.post);
    return Boolean(res && res.status === "new");
  }
  return false;
}

async function pollChannel(ch: Channel, username: string): Promise<number> {
  const last = store.getMonitorLastId(username);
  if (last === undefined) {
    const top = await findTop(username);
    if (top <= 0) {
      store.setMonitorLastId(username, -1);
      console.log(`📡 ${ch.title}: qo'llab-quvvatlanmaydi (embed yo'q)`);
      return 0;
    }
    store.setMonitorLastId(username, top);
    let added = 0;
    for (let id = top; id > top - BACKFILL_IDS; id--) {
      if (await addIfText(ch, username, id)) added++;
      await new Promise((res) => setTimeout(res, SLEEP_MS));
    }
    console.log(`📡 ${ch.title}: boshlang'ich ${added} ta post yig'ildi (top=${top})`);
    return added;
  }
  if (last < 0) return 0;
  let id = last + 1;
  let added = 0;
  let misses = 0;
  for (let i = 0; i < NEW_PROBE_LIMIT; i++) {
    const r = await embedMessage(username, id);
    if (r.flood) {
      await new Promise((res) => setTimeout(res, 1500));
      break;
    }
    if (!r.found) {
      misses++;
      if (misses >= 2) break;
      id++;
      continue;
    }
    misses = 0;
    if (r.text) {
      const kind = await classifyWithAI(r.text);
      if (kind === "passenger") {
        const res = store.addMonitoredPost({
          channel: ch,
          text: r.text,
          messageId: id,
          postedAt: r.postedAt ?? new Date().toISOString(),
        });
        if (res && res.status === "new" && res.post) pushNotifyPhone(res.post);
        if (res && res.status === "new") added++;
      }
    }
    store.setMonitorLastId(username, id);
    id++;
    await new Promise((res) => setTimeout(res, SLEEP_MS));
  }
  return added;
}

export async function pollOnce(): Promise<number> {
  await store.ready();
  const results = await Promise.all(
    store.getActiveChannels().map(async (ch) => {
      try {
        const username = usernameFromUrl(ch.url);
        if (!username) return 0;
        const added = await pollChannel(ch, username);
        if (added > 0) console.log(`📡 ${ch.title}: +${added} yangi post`);
        return added;
      } catch (e) {
        console.error(`📡 ${ch.title}: xato -> ${String(e)}`);
        return 0;
      }
    })
  );
  return results.reduce((sum, n) => sum + n, 0);
}

let lastPolledAt = 0;
let polling = false;

export async function pollIfStale(maxAgeMs = 30_000): Promise<number> {
  if (polling) return 0;
  if (Date.now() - lastPolledAt < maxAgeMs) return 0;
  polling = true;
  try {
    return await pollOnce();
  } finally {
    lastPolledAt = Date.now();
    polling = false;
  }
}

export function startMonitor(): void {
  console.log(
    `📡 Kanal monitori ishga tushdi (${store.getActiveChannels().length} kanal, har 60 soniyada)`
  );
  pollOnce().catch(console.error);
  setInterval(() => pollOnce().catch(console.error), 60_000);
}
