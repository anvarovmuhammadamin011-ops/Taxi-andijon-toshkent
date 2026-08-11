import { store } from "./store";
import type { Post } from "../types";

function getApi(): string {
  const token = process.env.BOT_TOKEN ?? "";
  return `https://api.telegram.org/bot${token}`;
}

function formatPush(post: Post): string {
  const lines = [
    `🚕 ${post.route}`,
    "",
    post.text,
    "",
  ];
  if (post.phone) lines.push(`📞 ${post.phone}`);
  lines.push(`🔗 ${post.channelUrl}`);
  return lines.join("\n");
}

export function pushNotifyPhone(post: Post): void {
  if (!process.env.BOT_TOKEN) return;
  const targets = store.getDeliveryTargets().filter((t) => t.isActive && t.telegramId);
  if (targets.length === 0) return;
  for (const target of targets) {
    void sendPush(target.telegramId, formatPush(post)).then((res) => {
      if (!res.ok) console.error(`📳 push xato (${target.telegramId}): ${res.error}`);
    });
  }
}

async function sendPush(
  telegramId: number,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${getApi()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json()) as any;
    if (json.ok) return { ok: true };
    return { ok: false, error: json.description ?? JSON.stringify(json) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}