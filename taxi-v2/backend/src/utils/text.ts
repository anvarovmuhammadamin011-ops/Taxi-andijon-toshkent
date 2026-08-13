import { RouteId } from '../types';

export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[\u0400-\u04FF]/g, (c) => cyrToLat(c))
    .replace(/\s+/g, ' ')
    .trim();
}

const cyr: Record<string, string> = {
  а: 'a', б: 'b', д: 'd', е: 'e', ф: 'f', г: 'g', х: 'h', и: 'i', ж: 'j',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', в: 'v', я: 'ya', й: 'y', ё: 'yo', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ь: '', э: 'e', ю: 'yu', з: 'z',
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

function cyrToLat(c: string): string {
  return cyr[c] || c;
}

// Telefon: +998 90 123 45 67 / 998901234567 / 901234567 -> '998901234567'
export function extractPhone(text: string): string | null {
  const raw = text || '';
  const candidates = raw.match(/\+?\d[\d\s\-()]{7,}\d/g) || [];
  for (const c of candidates) {
    let digits = c.replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length === 9) digits = '998' + digits;
    if (digits.startsWith('998') && digits.length === 12) return digits;
    if (digits.length === 9 && /^(33|50|55|77|88|90|91|93|94|95|97|98|99)/.test(digits))
      return '998' + digits;
  }
  return null;
}

export function detectRoute(text: string): RouteId {
  const t = normalizeText(text);
  const hasT = t.includes('toshkent') || t.includes('tashkent');
  const hasA = t.includes('andijon') || t.includes('andijan') || t.includes('andizon');
  if (hasT && hasA) {
    return t.indexOf('toshkent') < t.indexOf('andijon') ? 'toshkent_andijon' : 'andijon_toshkent';
  }
  return 'unknown';
}

export function extractPassengerCount(text: string): number | null {
  const m = normalizeText(text).match(/(\d+)\s*(ta|kishi|odam|insan|kish)/);
  if (m) return parseInt(m[1] ?? m[0], 10);
  const m2 = text.match(/(\d+)\s*(киши|одам|та)/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

export function extractUsername(text: string): string | null {
  const m = text.match(/@([a-zA-Z0-9_]{4,32})/);
  return m ? m[1] : null;
}

export function generateFingerprint(text: string): string {
  const t = normalizeText(text);
  const phone = extractPhone(text) || '';
  return (t.slice(0, 60) + '|' + phone).replace(/\s+/g, ' ');
}
