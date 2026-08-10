import { store } from "./store";
import type { Channel } from "../types";

const MONITOR_SOURCES: { username: string; title: string }[] = [
  { username: "taxsislar", title: "Taksilar" },
  { username: "baliqchi2", title: "Baliqchi 2" },
  { username: "Chinabod_Tashkent_Baliqchi", title: "Chinabod Tashkent Baliqchi" },
  { username: "Oltinkol_Toshkent", title: "Oltinkol Toshkent" },
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const MAX_ID = 2_097_152;
const BACKFILL_IDS = 5;
const NEW_PROBE_LIMIT = 10;
const SLEEP_MS = 120;

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
  const res = await fetch(`https://t.me/${username}/${id}?embed=1&mode=tme`, {
    headers: { "User-Agent": UA, "Accept-Language": "uz,ru,en;q=0.8" },
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

async function addIfText(ch: Channel, id: number): Promise<boolean> {
  const username = ch.url.replace("https://t.me/", "").replace(/^@/, "");
  const r = await embedMessage(username, id);
  if (r.flood) await new Promise((res) => setTimeout(res, 1500));
  if (r.found && r.text) {
    const res = store.addMonitoredPost({
      channel: ch,
      text: r.text,
      messageId: id,
      postedAt: r.postedAt ?? new Date().toISOString(),
    });
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
      if (await addIfText(ch, id)) added++;
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
      const res = store.addMonitoredPost({
        channel: ch,
        text: r.text,
        messageId: id,
        postedAt: r.postedAt ?? new Date().toISOString(),
      });
      if (res && res.status === "new") added++;
    }
    store.setMonitorLastId(username, id);
    id++;
    await new Promise((res) => setTimeout(res, SLEEP_MS));
  }
  return added;
}

export async function pollOnce(): Promise<void> {
  for (const src of MONITOR_SOURCES) {
    try {
      const ch = store.ensureChannel(src.username, src.title);
      const added = await pollChannel(ch, src.username);
      if (added > 0) console.log(`📡 ${ch.title}: +${added} yangi post`);
    } catch (e) {
      console.error(`📡 ${src.username}: xato -> ${String(e)}`);
    }
  }
}

export function startMonitor(): void {
  console.log(`📡 Kanal monitori ishga tushdi (${MONITOR_SOURCES.length} kanal, har 60 soniyada)`);
  pollOnce().catch(console.error);
  setInterval(() => pollOnce().catch(console.error), 60_000);
}
