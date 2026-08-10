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
  /odam\s+(ol|to[']pla|yig)/i,
  /odam\s*kam/i,
  /odam\s+bormi/i,
  /odam\s+(bo[']lsa|borsa)\b/i,
  /kam\s*odam/i,
  /kamdimiz/i,
  /kamdamiz/i,
  /[\+]*\d\s*kam/i,
  /olamiz/i,
  /olaman\b/i,
  /olib\s+(ber|yur|chiq|ket(aman|adi|am|moqchi))/i,
  /yo[']lovchi\s*lar?\s*ol/i,
  /yo[']lovchi\s*(bormi|bo[']lsa|borsa|kerak|kam|qidir|izla)/i,
  /pochta\s*lar?\s*ol/i,
  /(odam|pochta|posilka)\s+o[́']?lam[iy]z?/i,
  /joy\s+bor\b/i,
  /joy\s+bosh\b/i,
  /joy\s+qol(di|gan)?\s*(bormi)?/i,
  /oldi\s+(bosh|bo[']sh)/i,
  /bosh\s+joy/i,
  /bo[']sh\s+joy/i,
  /to[']ld[iy]/i,
  /tashuvchi/i,
  /haydovchi/i,
  /xaydovchi/i,
  /mashina\s+bor\b/i,
  /avto\s+(bor|bush)/i,
  /avto\s*(kob|kobal|cobalt|nexia|gentra|lacetti|matiz|moshina)/i,
  /\b(cobalt|kobal[dt]|nexia|matiz|gentra|lacetti|damas|spark|malingua|sidar)\b/i,
  /tom\s+bagaj/i,
  /mijoz\s*(bormi|kerak|kam|bo[']lsa|borsa|qidir|izla)/i,
  /xaridor/i,
  /passajir/i,
  /pasajir/i,
  /boradigan\s+(odam|yo[']lovchi|mijoz)/i,
  /mol\s+(ol|tashiy)|tashiy/i,
  /tovar|yuk\s+/i,
  /shahar\s+(ichida|ichiga|ichdan)\s+(ol|qatna|aylan)/i,
  /shaxar\s+(ichida|ichiga|ichdan)\s+(ol|qatna|aylan)/i,
  /qo[']ng[']iroq\s+(qil|ber)\w*\s+(o[']lish|olish)/i,
  /non\s+top/i,
  /reys\s+qidir/i,
  /yo[']l\s+(ber|top|qil)/i,
  /mashina\s+top/i,
  /avtomashina\s+bor/i,
];

const PASSENGER_PATTERNS: RegExp[] = [
  /ketaman\b/i,
  /boraman\b/i,
  /borayapman\b/i,
  /boryapman\b/i,
  /ketayotgan\s+bor/i,
  /boradigan\s+bor/i,
  /ketadigan\s+bor/i,
  /qatnaydigan\s+bor/i,
  /yuradigan\s+bor/i,
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
  /odam\s+bor\b/i,
  /odam\s+(topil|chiq)\w*/i,
  /(\d+)\s*(ta|tacha)\s*odam/i,
  /odam\s+(boradigan|ketadigan|qatnaydigan|yuradigan)\s+bor/i,
  /yo[']lovchi\s+bor\b/i,
  /mijoz\s+(bor|topil|chiq)/i,
  /erta\s+(ketish|borish|chiqish)\s+bor/i,
  /borish\s+kerak/i,
  /ketish\s+kerak/i,
  /(borish|ketish|qaytish)\s+[kк][kк]\b/i,
  /yo[']l\s+(izlay|qidi)/i,
  /transport\s+(qidi|kerak)/i,
  /sayohat/i,
  /safarga/i,
];

export function classifyPostKind(text: string): PostKind {
  const t = toLatin(text);
  if (DRIVER_PATTERNS.some((re) => re.test(t))) return "driver";
  if (PASSENGER_PATTERNS.some((re) => re.test(t))) return "passenger";
  return "other";
}