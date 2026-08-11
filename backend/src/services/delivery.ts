import { store } from "./store";
import type { DeliveryTask } from "../types";

function getApi(): string {
  const token = process.env.BOT_TOKEN ?? "";
  return `https://api.telegram.org/bot${token}`;
}

export function formatDeliveryText(task: DeliveryTask): string {
  const lines = [
    `🚕 ${task.postRoute}`,
    "",
    task.postText,
  ];
  return lines.join("\n");
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.BOT_TOKEN) return { ok: false, error: "BOT_TOKEN backend/.env da yo'q" };
  const channel = chatId.startsWith("@") ? chatId : `@${chatId}`;
  try {
    const res = await fetch(`${getApi()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channel,
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

async function processDue(): Promise<void> {
  const now = Date.now();
  const due = store
    .getDeliveryTasks(1000)
    .filter((t) => t.status === "pending" && new Date(t.dueAt).getTime() <= now);
  for (const task of due) {
    const res = await sendTelegramMessage(task.channelUsername, formatDeliveryText(task));
    if (res.ok) {
      store.markTaskResult(task.id, true);
      console.log(`📨 [${task.id}] ${task.channelTitle} (${task.tier}) ga yuborildi`);
    } else {
      console.error(`❌ [${task.id}] ${task.channelTitle}: ${res.error}`);
      store.markTaskResult(task.id, false, res.error);
    }
  }
}

export function startDeliveryScheduler(): void {
  console.log("🚚 Post tarqatish rejadori ishga tushdi (har 10 soniyada)");
  processDue();
  setInterval(processDue, 10_000);
}
