import { cleanVerseText } from "@/lib/verse-text";
import type { BollsSearchResult, BollsVerse } from "@/lib/bible-api";

/**
 * api.bible (scripture.api.bible) provider — the primary source of Bible
 * text when API_BIBLE_KEY is set, with Bolls.life as fallback. Entirely
 * optional: with no key, every export here is a silent no-op, matching how
 * ELEVENLABS_API_KEY/OPENAI_API_KEY are treated elsewhere in this app.
 *
 * Important: having a key does NOT grant access to every translation. Your
 * key only exposes the Bibles your api.bible account has been granted
 * permission for (mostly public-domain by default; modern copyrighted
 * translations like NIV/ESV require a separate publisher grant in your
 * api.bible dashboard). This module only ever surfaces whatever GET /bibles
 * actually returns for your key — nothing is hardcoded or assumed.
 *
 * Note on imports: only type-only imports from @/lib/bible-api are allowed
 * here — a value import would pull in @/lib/db (Prisma at module load) and
 * break this module's node-env unit tests.
 */

const SCRIPTURE_API_BASE = "https://api.scripture.api.bible/v1";

// Standard USFM 3-letter book codes, indexed by this app's numeric book id
// (BIBLE_BOOKS in bible-books.ts). api.bible addresses chapters as
// "{USFM}.{chapter}", e.g. "JHN.3".
const USFM_BY_BOOK_ID: Record<number, string> = {
  1: "GEN", 2: "EXO", 3: "LEV", 4: "NUM", 5: "DEU", 6: "JOS", 7: "JDG", 8: "RUT",
  9: "1SA", 10: "2SA", 11: "1KI", 12: "2KI", 13: "1CH", 14: "2CH", 15: "EZR",
  16: "NEH", 17: "EST", 18: "JOB", 19: "PSA", 20: "PRO", 21: "ECC", 22: "SNG",
  23: "ISA", 24: "JER", 25: "LAM", 26: "EZK", 27: "DAN", 28: "HOS", 29: "JOL",
  30: "AMO", 31: "OBA", 32: "JON", 33: "MIC", 34: "NAM", 35: "HAB", 36: "ZEP",
  37: "HAG", 38: "ZEC", 39: "MAL",
  40: "MAT", 41: "MRK", 42: "LUK", 43: "JHN", 44: "ACT", 45: "ROM", 46: "1CO",
  47: "2CO", 48: "GAL", 49: "EPH", 50: "PHP", 51: "COL", 52: "1TH", 53: "2TH",
  54: "1TI", 55: "2TI", 56: "TIT", 57: "PHM", 58: "HEB", 59: "JAS", 60: "1PE",
  61: "2PE", 62: "1JN", 63: "2JN", 64: "3JN", 65: "JUD", 66: "REV",
};

export const USFM_TO_BOOK_ID: Record<string, number> = Object.fromEntries(
  Object.entries(USFM_BY_BOOK_ID).map(([id, usfm]) => [usfm, Number(id)])
);

export interface ScriptureApiBible {
  id: string;
  abbreviation: string;
  name: string;
  language: string;
}

/**
 * Turn an api.bible abbreviation into the short code shown in the UI and
 * used in reader URLs. English abbreviations frequently carry an "eng"
 * prefix ("engKJV", "engasv", "eng-web") that would read badly in the
 * picker, share cards, and page titles — strip it (only for English, only
 * when at least 2 characters remain), then uppercase. Non-English
 * abbreviations pass through untouched apart from uppercasing.
 */
export function normalizeTranslationCode(abbreviation: string, language: string): string {
  let code = abbreviation.trim();
  if (/^english\b/i.test(language)) {
    code = code.replace(/^eng[-_]?(?=[A-Za-z0-9]{2,}$)/i, "");
  }
  return code.toUpperCase();
}

/**
 * Parse an api.bible verse id like "JHN.3.16" (or a range id like
 * "JHN.3.16-JHN.3.18", which resolves to its first verse) into this app's
 * numeric book/chapter/verse. Returns null for unmapped books (apocrypha)
 * or unrecognized shapes.
 */
export function parseVerseId(
  id: string
): { book: number; chapter: number; verse: number } | null {
  const m = /^([0-9A-Z]{3})\.(\d+)\.(\d+)/.exec(id.trim().toUpperCase());
  if (!m) return null;
  const book = USFM_TO_BOOK_ID[m[1]];
  if (!book) return null;
  return { book, chapter: parseInt(m[2], 10), verse: parseInt(m[3], 10) };
}

function apiKey(): string | undefined {
  return process.env.API_BIBLE_KEY;
}

export function hasScriptureApiKey(): boolean {
  return !!apiKey();
}

function headers(): Record<string, string> {
  return { "api-key": apiKey()! };
}

/** All Bibles your api.bible key currently has access to. Empty if no key or on failure. */
export async function fetchScriptureApiBibles(): Promise<ScriptureApiBible[]> {
  const key = apiKey();
  if (!key) return [];
  try {
    const res = await fetch(`${SCRIPTURE_API_BASE}/bibles`, {
      headers: headers(),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data: unknown[] = Array.isArray(json?.data) ? json.data : [];
    return data
      .map((b): ScriptureApiBible | null => {
        const bible = b as Record<string, unknown>;
        const id = typeof bible.id === "string" ? bible.id : null;
        const abbreviation = typeof bible.abbreviation === "string" ? bible.abbreviation : null;
        const name = typeof bible.name === "string" ? bible.name : abbreviation;
        const language = (bible.language as Record<string, unknown> | undefined)?.name;
        if (!id || !abbreviation) return null;
        return {
          id,
          abbreviation,
          name: name ?? abbreviation,
          language: typeof language === "string" ? language : "Other",
        };
      })
      .filter((b): b is ScriptureApiBible => b !== null);
  } catch {
    return [];
  }
}

// Verse-marker spans look like: <span data-number="16" data-sid="JHN 3:16" class="v">16</span>
// (attribute order isn't guaranteed, so we match generically on any <span>
// whose attributes include class="v" and whose visible text is the verse
// number itself, then slice the raw HTML between consecutive markers).
const SPAN_RE = /<span([^>]*)>(\d+)<\/span>/g;

function isVerseMarker(attrs: string): boolean {
  return /\bclass="[^"]*\bv\b[^"]*"/.test(attrs);
}

export function parseChapterHtml(html: string): BollsVerse[] {
  const markers: Array<{ index: number; end: number; verse: number }> = [];
  let m: RegExpExecArray | null;
  SPAN_RE.lastIndex = 0;
  while ((m = SPAN_RE.exec(html)) !== null) {
    if (!isVerseMarker(m[1])) continue;
    markers.push({ index: m.index, end: m.index + m[0].length, verse: parseInt(m[2], 10) });
  }

  const verses: BollsVerse[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].end;
    const end = i + 1 < markers.length ? markers[i + 1].index : html.length;
    const text = cleanVerseText(html.slice(start, end));
    if (text) verses.push({ pk: markers[i].verse, verse: markers[i].verse, text });
  }
  return verses;
}

/** Fetch and parse one chapter's verses from a specific api.bible Bible. */
export async function fetchScriptureApiChapter(
  bibleId: string,
  book: number,
  chapter: number
): Promise<BollsVerse[]> {
  const usfm = USFM_BY_BOOK_ID[book];
  if (!usfm) throw new Error(`No USFM code for book ${book}`);

  const params = new URLSearchParams({
    "content-type": "html",
    "include-notes": "false",
    "include-titles": "false",
    "include-chapter-numbers": "false",
    "include-verse-numbers": "true",
    "include-verse-spans": "false",
  });

  const res = await fetch(
    `${SCRIPTURE_API_BASE}/bibles/${bibleId}/chapters/${usfm}.${chapter}?${params}`,
    { headers: headers(), next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`api.bible chapter fetch failed: ${res.status}`);
  const json = await res.json();
  const html = typeof json?.data?.content === "string" ? json.data.content : "";
  return parseChapterHtml(html);
}

/**
 * Search within one api.bible Bible. Maps the documented response
 * (data.verses[], or data.passages[] for reference-style queries) into the
 * app's search-result shape. Throws on an unrecognized shape or non-ok
 * response so the caller can fall back to Bolls; a genuinely empty result
 * returns [] without triggering that fallback.
 */
export async function searchScriptureApi(
  bibleId: string,
  query: string,
  limit = 51
): Promise<BollsSearchResult[]> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  const res = await fetch(
    `${SCRIPTURE_API_BASE}/bibles/${bibleId}/search?${params}`,
    { headers: headers(), next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`api.bible search failed: ${res.status}`);
  const json = await res.json();
  const data = json?.data as Record<string, unknown> | undefined;

  const mapItems = (
    items: unknown[],
    textOf: (item: Record<string, unknown>) => string
  ): BollsSearchResult[] =>
    items
      .map((raw): BollsSearchResult | null => {
        const item = raw as Record<string, unknown>;
        const ref = parseVerseId(typeof item.id === "string" ? item.id : "");
        if (!ref) return null;
        const text = cleanVerseText(textOf(item));
        if (!text) return null;
        return { ...ref, text };
      })
      .filter((r): r is BollsSearchResult => r !== null);

  if (Array.isArray(data?.verses)) {
    return mapItems(data.verses, (v) => (typeof v.text === "string" ? v.text : ""));
  }
  if (Array.isArray(data?.passages)) {
    return mapItems(data.passages, (p) =>
      typeof p.content === "string"
        ? p.content
        : typeof p.reference === "string"
        ? p.reference
        : ""
    );
  }
  throw new Error("api.bible search: unrecognized response shape");
}
