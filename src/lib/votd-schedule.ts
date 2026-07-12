// Pure day-of-year scheduling for Verse of the Day — deliberately dependency-
// free (no data-layer imports) so it can be unit-tested in isolation.
import votdList from "@/data/votd.json";

const VOTD_LIST = votdList as Array<{ book: number; chapter: number; verse: number }>;

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  return Math.floor(diff / 86_400_000);
}

/** Deterministic pick by day-of-year, cycling through the curated list. */
export function todaysReference(date: Date = new Date()): {
  book: number;
  chapter: number;
  verse: number;
} {
  const idx = ((dayOfYear(date) - 1) % VOTD_LIST.length + VOTD_LIST.length) % VOTD_LIST.length;
  return VOTD_LIST[idx];
}
