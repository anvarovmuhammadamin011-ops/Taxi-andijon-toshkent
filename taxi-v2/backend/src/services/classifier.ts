import { RouteId } from '../types';
import { normalizeText, extractPhone, detectRoute } from '../utils/text';

export interface ClassifyResult {
  type: 'PASSENGER' | 'DRIVER' | 'UNKNOWN';
  confidence: number;
  reason: string;
  route: RouteId;
  phone: string | null;
}

// Mashina modellari — eng kuchli DRIVER belgisi (transliteratsiya variantlari bilan)
const CAR_MODELS = [
  'cobalt', 'gentra', 'jentra', 'damas', 'nexia', 'malibu', 'spark', 'matiz', 'tico',
  'lacetti', 'jonda', 'kobilt', 'ravon', 'prius', 'camry', 'kia', 'solaris', 'labo',
  'nexia3', 'cobalta', 'espero', 'baxor', 'tahir', 'onix', 'kobalta', 'jonli',
  'kobolt', 'kublt', 'coblt', 'koblt', 'neksiya', 'jenta', 'jendira', 'cobal',
];

export function classifyMessage(text: string): ClassifyResult {
  const t = normalizeText(text);
  const route = detectRoute(text);
  const phone = extractPhone(text);

  if (!t) {
    return { type: 'UNKNOWN', confidence: 0, reason: 'Matn bo‘sh', route, phone };
  }

  let dScore = 0;
  let pScore = 0;
  const dReasons: string[] = [];
  const pReasons: string[] = [];

  // ============ DRIVER (taklif qiluvchi / xizmat ko'rsatuvchi) ============
  for (const m of CAR_MODELS) {
    if (new RegExp('\\b' + m + '\\b').test(t)) {
      dScore += 3;
      dReasons.push(`mashina modeli: ${m}`);
    }
  }

  if (/\b(joy|kam|o'?rin)\s+bor\b/.test(t) || /\b\d+\s*ta\s*(kam|joy|o'?rin)\b/.test(t)) {
    dScore += 2.5;
    dReasons.push('bo‘sh joy/kam bor (taklif)');
  }

  if (/\b(olamiz|olib\s+ketamiz|olib\s+keta\s+olamiz|olib\s+keta\s+oladi|tashib\s+beramiz|elkamiz|olib\s+ketaman|olib\s+boramiz)\b/.test(t)) {
    dScore += 3;
    dReasons.push('olamiz / olib ketamiz (haydovchi)');
  }

  if (/\b(mashina|avto|automobil)\s+bor\b/.test(t)) {
    dScore += 2.5;
    dReasons.push('mashinasi bor');
  } else if (/\bavto\b/.test(t) || /\bbagaj(lar)?\b/.test(t)) {
    dScore += 1.5;
    dReasons.push('avto/bagaj');
  }

  if (/\b(yuramiz|yuraman|boramiz|boraman|ketamiz|ketaman|chiqamiz|chiqaman|o'?tamiz|o'?taman|haydaymiz|haydayman)\b/.test(t)) {
    dScore += 1.2;
    dReasons.push('harakat fe‘li (yuramiz/ketamiz)');
  }

  if (/\b(taksi|taksist)\b/.test(t)) {
    dScore += 1.5;
    dReasons.push('taksi/taksist');
  }

  if (/\b(pochta|yuk)\b/.test(t)) {
    dScore += 1.2;
    dReasons.push('pochta/yuk');
  }

  // ============ PASSENGER (e'tiyoj qiluvchi / so'rovchi) ============
  if (/\b(mashina|avto|taksi|transport|haydovchi|mashinachi|joy|o'?rin)(lar)?\s+kerak\b/.test(t)) {
    pScore += 3;
    pReasons.push('mashina/joy/haydovchi kerak (e‘tiyoj)');
  }

  if (/\b(mashina|avto|taksi|transport|haydovchi|joy|o'?rin)(lar)?\s+bormi\b/.test(t)) {
    pScore += 3;
    pReasons.push('... bormi? (so‘rov)');
  }

  if (/\bkim\s+(bor|bormi|boradigan|ketadi|ketadigan|chiqadi|chiqadigan|qaytadi|qaytadigan|o'?tadi|haydasa|haydab)\b/.test(t)) {
    pScore += 3;
    pReasons.push('kim bor/ketadi (yo‘lovchi so‘rovi)');
  }

  if (/\b(qidiryapman|qidiryapmiz|qidiramiz|qidiryap|izlayapman|izlayapmiz|izlaymiz|izlayap)\b/.test(t)) {
    pScore += 3;
    pReasons.push('mashina qidiryapti');
  }

  if (/\b(borishim|ketishim|chiqishim|qaytishim|o'?tishim|tushishim)\b/.test(t)) {
    pScore += 3;
    pReasons.push('borish/chiqish istagi');
  }

  if (/\b(olib\s+keta\s+olasizmi|olib\s+ketsangiz|olib\s+keta\s+oladigan|olib\s+keting|tashib\s+bering|eltib\s+bering|haydab\s+bering)\b/.test(t)) {
    pScore += 3;
    pReasons.push('haydovchidan so‘rayapti');
  }

  if (/\b(kishimiz|kishi\s+bormiz|kishi\s+bormikan)\b/.test(t) || /\b\d+\s+(kishi|odam|insan)\s+(uchun|bormi|kerak|bormikan)\b/.test(t)) {
    pScore += 2.5;
    pReasons.push('o‘zini yo‘lovchi sifatida aytgan');
  }

  if (/\b(joy|o'?rin|mashina)\s+(topib|topaylik|topishga)\b/.test(t)) {
    pScore += 2.5;
    pReasons.push('joy/mashina topishga harakat');
  }

  // Aniq yo'nalish (Toshkent↔Andijon) + kishi soni yoki so'rov so'zi bo'lsa —
  // "Andijonga bormi, 1 kishi" kabi qisqa yo'lovchi e'lonlari ham tushsin.
  if (
    route !== 'unknown' &&
    (/\b\d+\s*(kishi|odam|insan)\b/.test(t) || /\b(bormi|bormikan|boradigan|ketadigan|chiqadigan)\b/.test(t))
  ) {
    pScore += 2;
    pReasons.push('yo‘nalishli yo‘lovchi so‘rovi');
  }

  // Transport konteksti: mashina/taksi/joy/yo'lovchi so'zi yoki aniq yo'nalish
  // bo'lmasa, bu taxi e'loni EMAS (masalan "qiz izlayapman", "subbatdosh kerak"
  // kabi e'lonlar taxi deb olinmasligi uchun).
  const hasTransportContext =
    /\b(mashina|avto|taksi|taxi|transport|haydovchi|mashinachi|joy|o'?rin|kishi|odam|yo'lovchi|passajir|sarf|narx)\b/.test(t) ||
    route !== 'unknown';

  // ============ Qaror ============
  let type: ClassifyResult['type'];
  let confidence: number;
  let reason: string;

  if (pScore === 0 && dScore === 0) {
    type = 'UNKNOWN';
    confidence = 0.3;
    reason = 'Aniqlash uchun yetarli belgi yo‘q';
  } else if (dScore >= 3 && pScore <= dScore) {
    // Aniq haydovchi taklifi (joy bor / olamiz / mashina modeli) ehtiyojga teng yoki ustun
    type = 'DRIVER';
    confidence = Math.min(0.99, 0.7 + dScore * 0.04);
    reason = dReasons.join('; ') || 'haydovchi taklifi';
  } else if (pScore >= 3) {
    // Aniq yo'lovchi ehtiyoji (kerak / bormi / kim bor / qidiramiz ...)
    type = 'PASSENGER';
    confidence = Math.min(0.99, 0.7 + pScore * 0.04);
    reason = pReasons.join('; ') || 'yo‘lovchi e‘tiyoji';
  } else if (dScore >= 3) {
    type = 'DRIVER';
    confidence = Math.min(0.95, 0.6 + dScore * 0.04);
    reason = dReasons.join('; ');
  } else if (pScore >= 2) {
    type = 'PASSENGER';
    confidence = Math.min(0.9, 0.55 + pScore * 0.05);
    reason = pReasons.join('; ');
  } else if (dScore >= 2) {
    type = 'DRIVER';
    confidence = Math.min(0.9, 0.55 + dScore * 0.05);
    reason = dReasons.join('; ');
  } else {
    type = pScore >= dScore ? 'PASSENGER' : 'DRIVER';
    confidence = 0.5;
    reason = pReasons.concat(dReasons).join('; ');
  }

  if (!hasTransportContext && type !== 'UNKNOWN') {
    type = 'UNKNOWN';
    confidence = Math.min(confidence, 0.3);
    reason = 'Transport konteksti yo‘q';
  }

  return { type, confidence, reason, route, phone };
}
