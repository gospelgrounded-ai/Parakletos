/**
 * Pure commentary helpers — shared by the API routes (selection, parsing)
 * and the Study panel (formatting, per-verse focus). Deliberately
 * dependency-free so node-env unit tests can cover them without pulling in
 * the Prisma client.
 */

export type ContentItem =
  | string
  | { text: string }
  | { heading: string }
  | { lineBreak: boolean }
  | unknown;

export interface HellaoCommentary {
  id: string;
  name: string;
  englishName: string;
  language: string;
  numberOfBooks: number;
}

export interface CommentaryVerse {
  verse: number;
  text: string;
}

export interface CommentaryPayload {
  introduction: string | null;
  verses: CommentaryVerse[];
}

export interface CommentarySourceInfo {
  id: string;
  name: string;
}

// Preferred commentary IDs from bible.helloao.org (public domain, English)
export const PREFERRED_COMMENTARY_IDS = ["mhc", "acc", "bsc", "gill", "jfb"];
export const DEFAULT_SOURCE_COUNT = 3;
export const MAX_SOURCES = 5;

// Display fallback when the live available-commentaries list is
// unreachable — ids are what matter (the DB cache may still satisfy them);
// names are best-effort labels.
export const FALLBACK_COMMENTARY_SOURCES: CommentarySourceInfo[] = [
  { id: "mhc", name: "Matthew Henry's Commentary" },
  { id: "acc", name: "Adam Clarke's Commentary" },
  { id: "bsc", name: "Albert Barnes' Notes" },
  { id: "gill", name: "John Gill's Exposition" },
  { id: "jfb", name: "Jamieson-Fausset-Brown" },
];

const SOURCE_ID_RE = /^[a-z0-9_-]{1,32}$/;

/** Flatten helloao content items (strings / {text} objects) into one string. */
export function extractText(content: ContentItem[]): string {
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        if ("text" in item) return (item as { text: string }).text;
      }
      return "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Commentary introductions arrive as one long run-on paragraph. Break them into
 * a few readable chunks: prefer existing newlines, otherwise group sentences so
 * no single block is an overwhelming wall of text.
 */
export function splitIntoParagraphs(text: string): string[] {
  const byNewline = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences || sentences.length <= 3) return [text.trim()];

  const perChunk = Math.ceil(sentences.length / Math.ceil(sentences.length / 3));
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += perChunk) {
    chunks.push(sentences.slice(i, i + perChunk).join("").trim());
  }
  return chunks;
}

function orderEnglish(all: HellaoCommentary[]): HellaoCommentary[] {
  const preferred = PREFERRED_COMMENTARY_IDS
    .map((id) => all.find((c) => c.id === id))
    .filter((c): c is HellaoCommentary => c !== undefined);
  const others = all.filter(
    (c) =>
      (c.language === "eng" || c.language === "en") &&
      !PREFERRED_COMMENTARY_IDS.includes(c.id)
  );
  return [...preferred, ...others];
}

/** The default selection: preferred sources first, then other English, capped. */
export function selectDefaultSources(all: HellaoCommentary[]): HellaoCommentary[] {
  return orderEnglish(all).slice(0, DEFAULT_SOURCE_COUNT);
}

/** Every English source in display order — feeds the source picker. */
export function listEnglishSources(all: HellaoCommentary[]): CommentarySourceInfo[] {
  return orderEnglish(all).map((c) => ({ id: c.id, name: c.englishName || c.name }));
}

/**
 * Parse and sanitize a ?sources= CSV. Ids are lowercased, must match a
 * strict allowlist pattern (they get interpolated into upstream URLs),
 * deduped, intersected with the live available list when one is known, and
 * capped. Returns null for absent/empty input — caller uses defaults.
 */
export function normalizeSourcesParam(
  raw: string | null,
  availableIds: string[]
): string[] | null {
  if (!raw) return null;
  const availableSet = new Set(availableIds.map((id) => id.toLowerCase()));
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (!SOURCE_ID_RE.test(id)) continue;
    if (availableSet.size > 0 && !availableSet.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_SOURCES) break;
  }
  return ids.length > 0 ? ids : null;
}

/**
 * Commentary entries often cover a verse range starting at their number
 * (an entry at v.1 discussing vv.1-8), so per-verse focus needs the
 * closest entry at-or-before the selected verse, not an exact match.
 */
export function findCoveringVerseEntry(
  verses: CommentaryVerse[],
  verse: number
): CommentaryVerse | null {
  let best: CommentaryVerse | null = null;
  for (const v of verses) {
    if (v.verse <= verse && (best === null || v.verse > best.verse)) {
      best = v;
    }
  }
  return best;
}
