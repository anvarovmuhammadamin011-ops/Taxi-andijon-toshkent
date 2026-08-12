// Text normalization and classification utilities (ported from backend)

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'j', з: 'z',
  и: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', й: 'y', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

export function toLatin(text: string): string {
  let out = '';
  for (const ch of text.toLowerCase()) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return out;
}

export function normalizeText(text: string): string {
  let normalized = toLatin(text.toLowerCase());
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

export function extractPhone(text: string): string | null {
  const patterns = [
    /(\+?998\s?)?(\d{2})\s?(\d{3})\s?(\d{2})\s?(\d{2})/,
    /(\d{9})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const digits = match[0].replace(/\D/g, '');
      if (digits.length >= 9) {
        return digits.slice(-9);
      }
    }
  }
  return null;
}

export function extractUsername(text: string): string | null {
  const match = text.match(/@(\w{5,})/);
  return match ? match[1] : null;
}

export function extractPassengerCount(text: string): number | null {
  const patterns = [/(\d+)\s*(ta|tachi|kishi|odam)/i, /(\d+)\s*(joy|mesta)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const count = parseInt(match[1], 10);
      if (count > 0 && count <= 10) return count;
    }
  }
  return null;
}

export function generateFingerprint(text: string): string {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter((w) => w.length > 2);
  return words.slice(0, 5).join(' ');
}

export function detectRoute(text: string): 'toshkent_andijon' | 'andijon_toshkent' | 'unknown' {
  const normalized = normalizeText(text);
  const hasToshkent = normalized.includes('toshkent');
  const hasAndijon = normalized.includes('andijon');

  if (hasToshkent && hasAndijon) {
    const tIdx = normalized.indexOf('toshkent');
    const aIdx = normalized.indexOf('andijon');
    return tIdx < aIdx ? 'toshkent_andijon' : 'andijon_toshkent';
  }
  return 'unknown';
}
