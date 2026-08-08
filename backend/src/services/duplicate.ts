import { Post } from "../types";

const DUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .replace(/т/g, "t")
    .replace(/о/g, "o")
    .replace(/ш/g, "sh")
    .replace(/к/g, "k")
    .replace(/а/g, "a")
    .replace(/и/g, "i")
    .replace(/ё/g, "e")
    .replace(/д/g, "d")
    .replace(/б/g, "b")
    .replace(/у/g, "u")
    .replace(/н/g, "n")
    .replace(/л/g, "l")
    .replace(/г/g, "g")
    .replace(/с/g, "s");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

export function isDuplicateOf(candidate: Post, existing: Post, phone?: string): boolean {
  const timeDiff = Math.abs(
    new Date(candidate.postedAt).getTime() - new Date(existing.postedAt).getTime()
  );
  if (timeDiff > DUP_WINDOW_MS) return false;

  if (phone && existing.phone === phone) return true;

  const a = normalizeText(candidate.text);
  const b = normalizeText(existing.text);
  if (a === b && a.length > 8) return true;
  if (similarity(a, b) > 0.88 && a.length > 20) return true;

  return false;
}

export function findDuplicates(candidate: Post, all: Post[], phone?: string): Post[] {
  return all.filter((p) => p.id !== candidate.id && isDuplicateOf(candidate, p, phone));
}
