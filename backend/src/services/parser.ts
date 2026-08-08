export interface City {
  latin: string;
  cyr: string;
  title: string;
}

export const CITIES: City[] = [
  { latin: "toshkent", cyr: "тошкент", title: "Toshkent" },
  { latin: "andijon", cyr: "андижон", title: "Andijon" },
  { latin: "haqqulobod", cyr: "хаққулобод", title: "Haqqulobod" },
  { latin: "namangan", cyr: "наманган", title: "Namangan" },
  { latin: "farg'ona", cyr: "фарғона", title: "Farg'ona" },
  { latin: "ferg'ona", cyr: "ферғона", title: "Farg'ona" },
  { latin: "qo'qon", cyr: "қўқон", title: "Qo'qon" },
  { latin: "xakulobod", cyr: "хаккулобод", title: "Haqqulobod" },
];

const FROM_SUFFIXES = ["dan", "дан"];
const TO_SUFFIXES = ["ga", "га", "ka", "ка", "бa", "ba", "qa", "қа"];

export interface ParsedPost {
  phone?: string;
  people?: number;
  from?: string;
  to?: string;
  route: string;
  cities: string[];
}

function stripPunct(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
}

function matches(text: string, base: string, suffixes: string[]): boolean {
  const clean = " " + text + " ";
  return suffixes.some((sfx) => clean.includes(base + sfx));
}

function containsWord(text: string, word: string): boolean {
  const clean = " " + text + " ";
  const variants = [word, word.replace(/`/g, "")];
  return variants.some((w) => clean.includes(" " + w + " ") || clean.includes(" " + w + ",") || clean.includes(" " + w + "."));
}

export function extractPhone(text: string): string | undefined {
  const runs = text.match(/\d[\d\s\-]{7,14}\d/g) ?? [];
  for (const run of runs) {
    const digits = run.replace(/\D/g, "");
    if (digits.length === 9 && /^[0-9]/.test(digits)) return digits;
    if (digits.length === 12 && digits.startsWith("998")) return digits;
    if (digits.length === 10 && digits.startsWith("8")) return digits.slice(1);
  }
  for (const run of runs) {
    const digits = run.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("998")) return digits;
  }
  return undefined;
}

export function extractPeople(text: string): number | undefined {
  const patterns = [
    /(\d+)\s*(?:ta|та|da)\s*(?:odam|одам|joy|жой|kishi|киши|место)/i,
    /(\d+)\s*(?:odam|одам|joy|жой|kishi|киши|место)\b/i,
    /(?:odam|одам|joy|жой)\s*(?:bor|бар)\s*(\d+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 12) return n;
    }
  }
  return undefined;
}

export function detectRoute(text: string): { from?: string; to?: string; route: string; cities: string[] } {
  const clean = stripPunct(text);
  const foundCities: string[] = [];
  let from: string | undefined;
  let to: string | undefined;

  for (const city of CITIES) {
    if (matches(clean, city.latin, FROM_SUFFIXES) || matches(clean, city.cyr, FROM_SUFFIXES)) {
      foundCities.push(city.title);
      from = from ?? city.title;
    }
  }
  for (const city of CITIES) {
    if (matches(clean, city.latin, TO_SUFFIXES) || matches(clean, city.cyr, TO_SUFFIXES)) {
      foundCities.push(city.title);
      to = to ?? city.title;
    }
  }

  if (!from && !to) {
    for (const city of CITIES) {
      if (containsWord(clean, city.latin) || containsWord(clean, city.cyr)) {
        foundCities.push(city.title);
        if (city.title !== "Toshkent") {
          from = from ?? "Andijon";
          to = to ?? "Toshkent";
        } else {
          from = from ?? "Toshkent";
          to = to ?? "Andijon";
        }
        break;
      }
    }
  }

  if (from && to) {
    return { from, to, route: `${from} -> ${to}`, cities: [...new Set(foundCities)] };
  }
  if (to) {
    from = to === "Toshkent" ? "Andijon" : "Toshkent";
    return { from, to, route: `${from} -> ${to}`, cities: [...new Set(foundCities)] };
  }
  if (from) {
    to = from === "Toshkent" ? "Andijon" : "Toshkent";
    return { from, to, route: `${from} -> ${to}`, cities: [...new Set(foundCities)] };
  }
  return { from: "Toshkent", to: "Andijon", route: "Toshkent -> Andijon", cities: [] };
}

export function parsePost(text: string): ParsedPost {
  const phone = extractPhone(text);
  const people = extractPeople(text);
  const route = detectRoute(text);
  return { phone, people, ...route };
}
