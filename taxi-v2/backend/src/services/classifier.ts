import { RouteId } from '../types';
import { normalizeText, extractPhone, detectRoute } from '../utils/text';

export interface ClassifyResult {
  type: 'PASSENGER' | 'DRIVER' | 'UNKNOWN';
  confidence: number;
  reason: string;
  route: RouteId;
  phone: string | null;
}

// Mashina modellari — eng kuchli DRIVER belgisi
const CAR_MODELS = [
  'cobalt', 'gentra', 'jentra', 'damas', 'nexia', 'malibu', 'spark', 'matiz', 'tico',
  'lacetti', 'jonda', 'kobilt', 'ravon', 'prius', 'camry', 'kia', 'solaris', 'labo',
  'nexia3', 'cobalta', 'espero', 'baxor', 'tahir', 'onix', 'kobalta', 'jonli',
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

  // ============ DRIVER (taklif qiluvchi) belgilari ============
  for (const m of CAR_MODELS) {
    if (new RegExp('\\b' + m + '\\b').test(t)) {
      dScore += 3;
      dReasons.push(`mashina modeli: ${m}`);
    }
  }

  if (/\b(joy|o'?rin|orin)\s+bor\b/.test(t) || /\bbo'?sh\s+joy\b/.test(t) || /\b\d+\s*ta\s+joy\b/.test(t)) {
    dScore += 2.5;
    dReasons.push('bo‘sh joy borligi aytilgan (taklif)');
  }

  if (/\b(odam|yolovchi|pochta|yuk)\s+olamiz\b/.test(t) || /\bolamiz\b/.test(t) || /\bolib\s+keta/.test(t) || /\bolib\s+bor/.test(t)) {
    dScore += 2.5;
    dReasons.push('odam/yo‘lovchi olamiz (haydovchi)');
  }

  if (/\b(mashina|avto|automobil)\s+bor\b/.test(t)) {
    dScore += 2.5;
    dReasons.push('mashinasi borligi aytilgan');
  } else if (/\bavto\b/.test(t) || /\bbaga?jli\b/.test(t)) {
    dScore += 1.5;
    dReasons.push('avto/bagajli');
  }

  if (/\b(yuramiz|yuraman|boramiz|boraman|ketamiz|ketaman|chiqamiz|chiqaman|o'?tamiz|o'?taman)\b/.test(t)) {
    dScore += 1.2;
    dReasons.push('harakat fe‘li (yuramiz/ketamiz)');
  }

  if (/\b(taksi|taksist|haydovchi)\b/.test(t)) {
    dScore += 1.5;
    dReasons.push('taksi/haydovchi');
  }

  if (/\b(pochta|yuk)\b/.test(t)) {
    dScore += 1.2;
    dReasons.push('pochta/yuk');
  }

  // ============ PASSENGER (e'tiyoj qiluvchi) belgilari ============
  if (/\b(mashina|taksi|avto)\s+kerak\b/.test(t) || /\bjoy\s+kerak\b/.test(t) || /\bo'?rin(lar)?\s+kerak\b/.test(t)) {
    pScore += 3;
    pReasons.push('mashina/taksi/joy kerak (e‘tiyoj)');
  }

  if (
    /\b(borishim|ketishim|qaytishim|ketmoqchi|qaytmoqchi|chiqishim)\b/.test(t) ||
    /moqchiman\b/.test(t) ||
    /chiman\b/.test(t) ||
    /\bborishim\s+kerak\b/.test(t)
  ) {
    pScore += 3;
    pReasons.push('borish/chiqish istagi (yo‘lovchi)');
  }

  if (/\b(qidir|izla|izlay|qidiramiz|qidiryap)\b/.test(t)) {
    pScore += 2.5;
    pReasons.push('mashina qidiryapti');
  }

  if (/\b(kishimiz|yolovchimiz)\b/.test(t) || /\bbiz\s+\d+\s*kishi/.test(t) || /\b\d+\s*kishimiz\b/.test(t)) {
    pScore += 2.5;
    pReasons.push('o‘zini yo‘lovchi sifatida aytgan (kishimiz)');
  }

  if (/\b(olib\s+ketasiz|olib\s+ketadigan|kim\s+bor|kim\s+ketadi|qaytadigan\s+mashina\s+kerak)\b/.test(t)) {
    pScore += 2.5;
    pReasons.push('haydovchidan so‘rayapti');
  }

  // ============ Qaror ============
  const dStrong = dScore >= 3;
  const pStrong = pScore >= 3;

  let type: ClassifyResult['type'];
  let confidence: number;
  let reason: string;

  if (dScore === 0 && pScore === 0) {
    type = 'UNKNOWN';
    confidence = 0.3;
    reason = 'Aniqlash uchun yetarli belgi yo‘q';
  } else if (dStrong && !pStrong) {
    type = 'DRIVER';
    confidence = Math.min(0.99, 0.7 + dScore * 0.04);
    reason = dReasons.join('; ');
  } else if (pStrong && !dStrong) {
    type = 'PASSENGER';
    confidence = Math.min(0.99, 0.7 + pScore * 0.04);
    reason = pReasons.join('; ');
  } else if (dScore >= pScore) {
    // Aralash/yoki zaif belgilar — eng katta xato (taksi posti yo‘lovchi sifatida)
    // bo‘lmasligi uchun DRIVER tomoniga egilamiz
    type = 'DRIVER';
    confidence = Math.min(0.85, 0.5 + Math.max(dScore, pScore) * 0.03);
    reason = dReasons.concat(pReasons).join('; ') || 'aralash belgilar';
  } else {
    type = 'PASSENGER';
    confidence = Math.min(0.85, 0.5 + pScore * 0.03);
    reason = pReasons.join('; ');
  }

  return { type, confidence, reason, route, phone };
}
