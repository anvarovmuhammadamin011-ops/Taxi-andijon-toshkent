import { classifyPostKind, PostKind } from "./postKind";

const CACHE = new Map<string, PostKind>();
const MAX_CACHE = 2000;

function apiKey(): string {
  return process.env.AI_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "";
}

export function aiEnabled(): boolean {
  return Boolean(apiKey());
}

export function aiBaseUrl(): string {
  return process.env.AI_BASE_URL ?? "https://api.deepseek.com";
}

export function aiModel(): string {
  return process.env.AI_MODEL ?? "deepseek-chat";
}

const SYSTEM_PROMPT = `Sen O'zbekiston (Andijon-Toshkent) taksi e'lonlarini saralaydigan klassifikatorsan.

E'lon ikki turga bo'linadi:
- "passenger" (yo'lovchi): ODAM transporte joy/qidirmoqda. Belgilar: "ketaman", "boraman", "joy bormi", "2 odam kerak", "odam bor" (yo'lovchilar borga o'xshash), "izlayapman/qidiryapman", "transport kerak", "ertaga ertalab chiqish kerak", "kk" = kerak, "chiqishim kerak", "chiqaman", "ketadigan bor", "kim bor Toshkentga ketadigan", "joy qidiraman", "o'rin kerak".
- "driver" (haydovchi/taksi): HAYDOVCHI yo'lovchi/yuk qidiradi. Belgilar: "odam olamiz/olaman", "odam kam", "joy bor", "joy bosh / oldi bosh / mesta bosh", "pochta olamiz/olaman", "yuramiz/qaytamiz/ketamiz" + odam/joy, avto modeli (cobalt, nexia...), "tom bagaj", "shahar ichida", "ayollar bor, oldi bosh".
- "other": yuqoridagilarga aloqasi yo'q (reklama, spam, boshqa shahar bepul).

Muhim: "2 ta odam kerak" = yo'lovchi o'ziga joy kerak (passenger). "2 ta odam kam / olamiz" = haydovchi (driver). Faqat JSON qaytar: {"kind": "passenger" | "driver" | "other"}`;

function cacheKey(text: string): string {
  return text.slice(0, 1500);
}

export async function classifyWithAI(text: string): Promise<PostKind> {
  const key = cacheKey(text);
  const cached = CACHE.get(key);
  if (cached) return cached;

  const regexKind = classifyPostKind(text);
  if (regexKind !== "other") {
    cacheSet(key, regexKind);
    return regexKind;
  }

  if (!aiEnabled()) {
    cacheSet(key, regexKind);
    return regexKind;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(`${aiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model: aiModel(),
        temperature: 0,
        max_tokens: 64,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 3000) },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`AI http ${res.status}`);
    const json = (await res.json()) as any;
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const m = content.match(/"kind"\s*:\s*"(passenger|driver|other)"/);
    const kind: PostKind = m ? (m[1] as PostKind) : regexKind;
    cacheSet(key, kind);
    return kind;
  } catch {
    return regexKind;
  }
}

function cacheSet(key: string, kind: PostKind): void {
  if (CACHE.size >= MAX_CACHE) {
    const first = CACHE.keys().next().value;
    if (first !== undefined) CACHE.delete(first);
  }
  CACHE.set(key, kind);
}