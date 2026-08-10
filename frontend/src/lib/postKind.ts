export type PostKind = "passenger" | "driver" | "other";

const CYR_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "j", з: "z",
  и: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "c", ч: "ch", ш: "sh", щ: "sh",
  ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", й: "y", ў: "o", қ: "q", ғ: "g",
  ҳ: "h", "’": "'", "ʼ": "'", "‘": "'",
};

export function toLatin(text: string): string {
  let out = "";
  for (const ch of (text ?? "").toLowerCase()) {
    out += CYR_TO_LATIN[ch] ?? ch;
  }
  return out;
}

const DRIVER_PATTERNS: RegExp[] = [
  /odam\s*lar?\s*ol/i,
  /olamiz/i,
  /olaman\b/i,
  /olib\s+(ber|yur)/i,
  /yo[']lovchi\s*lar?\s*ol/i,
  /pochta\s*lar?\s*ol/i,
  /odam\s*kam/i,
  /kam\s*odam/i,
  /kamdamiz/i,
  /joy\s+bor\b/i,
  /tashuvchi/i,
  /haydovchi/i,
  /xaydovchi/i,
  /mashina\s+bor\b/i,
  /avto\s+(bor|bush)/i,
  /tom\s+bagaj/i,
];

const PASSENGER_PATTERNS: RegExp[] = [
  /ketaman\b/i,
  /boraman\b/i,
  /borayapman\b/i,
  /boryapman\b/i,
  /ketayotgan\s+bor/i,
  /boradigan\s+bor/i,
  /kim\s+(bor|ket|bar)/i,
  /joy\s+bormi/i,
  /joy\s+(qidi|izla)/i,
  /joy\s+kerak/i,
  /o[']rin\s+(kerak|qidi|izla|borm)/i,
  /olib\s+ketadigan\s+kerak/i,
  /menga\s+(joy|o[']rin)/i,
  /men\s+(ham\s+)?(boraman|ketaman|borayapman|boryapman)/i,
  /biz\s+(ham\s+)?ketamiz/i,
  /qidiryapman/i,
  /izlayapman/i,
];

export function classifyPostKind(text: string): PostKind {
  const t = toLatin(text);
  if (DRIVER_PATTERNS.some((re) => re.test(t))) return "driver";
  if (PASSENGER_PATTERNS.some((re) => re.test(t))) return "passenger";
  return "other";
}
