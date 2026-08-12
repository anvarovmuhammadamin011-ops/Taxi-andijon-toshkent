// Message classifier (ported from backend). Runs fully in the browser.

import { RouteId } from './types';
import { toLatin } from './text';

interface SignalPattern {
  pattern: RegExp;
  weight: number;
  description: string;
}

const PASSENGER_SIGNALS: SignalPattern[] = [
  { pattern: /mashina\s*kerak/i, weight: 3.0, description: 'mashina kerak' },
  { pattern: /taksi\s*kerak/i, weight: 2.5, description: 'taksi kerak' },
  { pattern: /joy\s*kerak/i, weight: 2.5, description: 'joy kerak' },
  { pattern: /olib\s*keting/i, weight: 2.5, description: 'olib keting' },
  { pattern: /ketmoqchiman/i, weight: 2.5, description: 'ketmoqchiman' },
  { pattern: /ketmoqchimiz/i, weight: 2.5, description: 'ketmoqchimiz' },
  { pattern: /bormoqchiman/i, weight: 2.5, description: 'bormoqchiman' },
  { pattern: /mashina\s*qidiryapman/i, weight: 3.0, description: 'mashina qidiryapman' },
  { pattern: /yo'lovchi\s*man/i, weight: 2.0, description: "yo'lovchi man" },
  { pattern: /menga\s+joy/i, weight: 2.0, description: 'menga joy' },
  { pattern: /bizga\s+joy/i, weight: 2.0, description: 'bizga joy' },
  { pattern: /ketaman/i, weight: 1.5, description: 'ketaman' },
  { pattern: /boraman/i, weight: 1.5, description: 'boraman' },
  { pattern: /ketamiz/i, weight: 1.5, description: 'ketamiz' },
  { pattern: /boramiz/i, weight: 1.5, description: 'boramiz' },
  { pattern: /ketishim\s*kerak/i, weight: 2.0, description: 'ketishim kerak' },
  { pattern: /borishim\s*kerak/i, weight: 2.0, description: 'borishim kerak' },
  { pattern: /kishi\s*kerak/i, weight: 1.5, description: 'kishi kerak' },
  { pattern: /srochni/i, weight: 1.0, description: 'srochni' },
];

const DRIVER_SIGNALS: SignalPattern[] = [
  { pattern: /odam\s*olaman/i, weight: 3.0, description: 'odam olaman' },
  { pattern: /odam\s*olamiz/i, weight: 3.0, description: 'odam olamiz' },
  { pattern: /passajir\s*olaman/i, weight: 3.0, description: 'passajir olaman' },
  { pattern: /yo'lovchi\s*olaman/i, weight: 3.0, description: "yo'lovchi olaman" },
  { pattern: /odam\s*kam/i, weight: 2.5, description: 'odam kam' },
  { pattern: /joy\s*bor/i, weight: 2.5, description: 'joy bor' },
  { pattern: /bo'sh\s*joy/i, weight: 2.5, description: "bo'sh joy" },
  { pattern: /bosh\s*joy/i, weight: 2.5, description: 'bosh joy' },
  { pattern: /mashina\s*bor/i, weight: 2.0, description: 'mashina bor' },
  { pattern: /mashina\s*bosh/i, weight: 2.5, description: 'mashina bosh' },
  { pattern: /olib\s*ketaman/i, weight: 2.5, description: 'olib ketaman' },
  { pattern: /pochta\s*olaman/i, weight: 2.5, description: 'pochta olaman' },
  { pattern: /ketaman/i, weight: 1.0, description: 'ketaman (driver)' },
  { pattern: /boraman/i, weight: 1.0, description: 'boraman (driver)' },
  { pattern: /odam\s*bor/i, weight: 1.5, description: 'odam bor' },
  { pattern: /mijoz\s*bor/i, weight: 2.0, description: 'mijoz bor' },
  { pattern: /cobalt|kobalt|nexia|gentra|lacetti|matiz|damas|spark|malibu/i, weight: 1.5, description: 'car model' },
];

const CONFIDENCE_THRESHOLD = 0.6;

export type Classification = 'passenger' | 'driver' | 'unknown';

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  scores: { passenger: number; driver: number };
  signals: string[];
}

export function classifyMessage(text: string): ClassificationResult {
  const latinText = toLatin(text.toLowerCase());
  const cyrillicText = text.toLowerCase();
  const combinedText = `${latinText} ${cyrillicText}`;

  let passengerScore = 0;
  let driverScore = 0;
  const signals: string[] = [];

  for (const signal of PASSENGER_SIGNALS) {
    if (signal.pattern.test(combinedText)) {
      passengerScore += signal.weight;
      signals.push(`PASSENGER: ${signal.description}`);
    }
  }

  for (const signal of DRIVER_SIGNALS) {
    if (signal.pattern.test(combinedText)) {
      driverScore += signal.weight;
      signals.push(`DRIVER: ${signal.description}`);
    }
  }

  const maxScore = 10;
  const normalizedPassenger = Math.min(passengerScore / maxScore, 1.0);
  const normalizedDriver = Math.min(driverScore / maxScore, 1.0);

  let classification: Classification;
  let confidence: number;

  if (passengerScore > driverScore && normalizedPassenger >= CONFIDENCE_THRESHOLD) {
    classification = 'passenger';
    confidence = normalizedPassenger;
  } else if (driverScore > passengerScore && normalizedDriver >= CONFIDENCE_THRESHOLD) {
    classification = 'driver';
    confidence = normalizedDriver;
  } else {
    classification = 'unknown';
    confidence = Math.max(normalizedPassenger, normalizedDriver);
  }

  return {
    classification,
    confidence,
    scores: { passenger: normalizedPassenger, driver: normalizedDriver },
    signals,
  };
}

export type { RouteId };
