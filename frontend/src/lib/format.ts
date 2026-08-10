export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "hozirgina";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Kecha";
  if (d < 7) return `${d} kun oldin`;
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

export function timeClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const prefix = sameDay ? "bugun" : d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
  return `${prefix}, ${timeClock(iso)}`;
}

export function isNewPost(iso: string, minutes = 30): boolean {
  return Date.now() - new Date(iso).getTime() < minutes * 60_000;
}

export function normalizePhone(raw?: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return "+998" + digits;
  if (digits.length === 12 && digits.startsWith("998")) return "+" + digits;
  if (digits.length === 10 && digits.startsWith("8")) return "+998" + digits.slice(1);
  return raw;
}

export function displayPhone(raw?: string): string {
  const n = normalizePhone(raw);
  if (!n) return "";
  const d = n.replace(/\D/g, "").slice(-12);
  return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10, 12)}`;
}

const PHONE_CANDIDATE_RE = /(?<!\d)(?:\+?998[\s\-]?)?\d(?:[\s\-]?\d){8,11}(?!\d)/g;

export function formatPhonesInText(text: string): string {
  return text.replace(PHONE_CANDIDATE_RE, (m) => {
    const cleaned = m.replace(/\D/g, "");
    if (!/^(?:\d{9}|8\d{9}|998\d{9})$/.test(cleaned)) return m;
    return displayPhone(cleaned);
  });
}

export function routeKey(from: string, to: string): string {
  return `${from} -> ${to}`;
}

export function matchesFilter(from: string, to: string, filter: string): boolean {
  if (filter === "all") return true;
  return routeKey(from, to) === filter;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("uz-UZ").replace(/,/g, " ");
}

export function formatDateShort(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function daysLeft(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}
