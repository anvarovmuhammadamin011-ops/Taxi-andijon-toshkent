// Frontend-only Telegram collector. Polls the Bot API directly from the browser
// so the app needs NO backend server. The bot token is read from VITE_TELEGRAM_BOT_TOKEN.
//
// SECURITY NOTE: a Vite public env var is embedded in the client bundle, so the
// bot token is visible to anyone who opens the app. For a personal mini-app this
// is acceptable, but rotate the token if it gets abused. A serverless proxy can
// hide it later without running a full backend.

import { Post } from './types';
import { classifyMessage } from './classifier';
import { normalizeText, extractPhone, extractUsername, extractPassengerCount, generateFingerprint, detectRoute } from './text';

const TOKEN: string = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string) || '';
const POLL_TIMEOUT = 5; // seconds (long-poll)
const POLL_GAP = 1500; // ms between cycles

type NewPostFn = (post: Post) => void;

let offset = 0;
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let listeners: NewPostFn[] = [];

export function isBotConfigured(): boolean {
  return !!TOKEN;
}

export function onNewPost(fn: NewPostFn): void {
  listeners.push(fn);
}

function buildPost(text: string, meta: { channelId: string; channelTitle: string; channelUrl: string; messageId: number; messageDate: string }): Post {
  const result = classifyMessage(text);
  return {
    id: `${meta.channelId}_${meta.messageId}`,
    messageId: meta.messageId,
    channelId: meta.channelId,
    channelTitle: meta.channelTitle,
    channelUrl: meta.channelUrl,
    originalText: text,
    normalizedText: normalizeText(text),
    route: detectRoute(text),
    passengerCount: extractPassengerCount(text),
    phone: extractPhone(text),
    username: extractUsername(text),
    classification: result.classification,
    confidence: result.confidence,
    duplicateFingerprint: generateFingerprint(text),
    isDuplicate: false,
    messageDate: meta.messageDate,
    collectedAt: new Date().toISOString(),
  };
}

async function pollOnce(): Promise<void> {
  if (!TOKEN) return;
  try {
    const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=${POLL_TIMEOUT}&allowed_updates=%5B%22message%22%5D`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;

    for (const upd of data.result) {
      offset = upd.update_id + 1;
      const msg = upd.message;
      if (!msg || !msg.text) continue;

      const fwd = msg.forward_from_chat;
      const channelId = fwd ? String(fwd.id) : 'bot';
      const channelTitle = fwd ? (fwd.title || fwd.username || 'Bot') : 'Bot (forwarded)';
      const channelUrl = fwd?.username
        ? `https://t.me/${fwd.username}`
        : fwd
        ? `https://t.me/c/${fwd.id}`
        : '';

      const post = buildPost(msg.text, {
        channelId,
        channelTitle,
        channelUrl,
        messageId: msg.message_id,
        messageDate: msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString(),
      });

      listeners.forEach((fn) => fn(post));
    }
  } catch {
    // network errors are ignored; next cycle retries
  }
}

async function loop(): Promise<void> {
  if (!running) return;
  await pollOnce();
  if (running) timer = setTimeout(loop, POLL_GAP);
}

export function startBotPolling(): void {
  if (!TOKEN || running) return;
  running = true;
  loop();
}

export function stopBotPolling(): void {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

// Allow the store to reset the processed offset (e.g. on first start)
export function resetOffset(): void {
  offset = 0;
}
