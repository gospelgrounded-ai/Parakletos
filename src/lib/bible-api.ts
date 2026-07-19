import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { cleanVerseText } from "@/lib/verse-text";
import {
  fetchScriptureApiBibles,
  fetchScriptureApiChapter,
  hasScriptureApiKey,
  normalizeTranslationCode,
  searchScriptureApi,
  type ScriptureApiBible,
} from "@/lib/bible-api-scripture";

const BOLLS_BASE = "https://bolls.life";

export interface BollsVerse {
  pk: number;
  verse: number;
  text: string;
}

export interface BollsTranslation {
  short_name: string;
  full_name: string;
  language: string;
}

export interface BollsLanguageGroup {
  language: string;
  translations: BollsTranslation[];
}

export interface BollsSearchResult {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

const FETCH_OPTIONS = {
  next: { revalidate: 3600 },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://bolls.life/",
  },
} as const;

// Moved to the pure module so provider clients and tests can use it without
// importing the Prisma-backed parts of this file; re-exported for the many
// existing importers (and used below).
export { cleanVerseText };

export async function fetchTranslations(): Promise<BollsLanguageGroup[]> {
  const res = await fetch(
    `${BOLLS_BASE}/static/bolls/app/views/languages-and-translations.json`,
    {
      next: { revalidate: 86400 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://bolls.life/",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch translations");
  const data = await res.json();
  const groups: BollsLanguageGroup[] = Array.isArray(data)
    ? data
    : Object.entries(data).map(([language, translations]) => ({
        language,
        translations: (translations as BollsTranslation[]) || [],
      }));
  return groups;
}

function groupScriptureApiBibles(bibles: ScriptureApiBible[]): BollsLanguageGroup[] {
  // Normalize abbreviations here — the one place api.bible Bibles become
  // BollsTranslations — so the route, hook, picker, share cards, and page
  // titles all see clean codes ("KJV", not "ENGKJV"). Dedupe by normalized
  // code (keep first) since e.g. two KJV editions may collapse to one code.
  const groups: BollsLanguageGroup[] = [];
  const seen = new Set<string>();
  for (const bible of bibles) {
    const code = normalizeTranslationCode(bible.abbreviation, bible.language);
    if (seen.has(code)) continue;
    seen.add(code);
    let group = groups.find((g) => g.language === bible.language);
    if (!group) {
      group = { language: bible.language, translations: [] };
      groups.push(group);
    }
    group.translations.push({
      short_name: code,
      full_name: bible.name,
      language: bible.language,
    });
  }
  return groups;
}

export interface TranslationSourceResult {
  source: "api.bible" | "bolls";
  groups: BollsLanguageGroup[];
  /** True only when even Bolls' own live fetch failed and this is the
   *  hardcoded static list — signals a shorter cache so the next request
   *  retries sooner instead of pinning a stale response for a full day. */
  stale: boolean;
}

/**
 * api.bible is the primary translation source: when API_BIBLE_KEY is set
 * and has at least one Bible attached to it, its list is used as-is.
 * Bolls.life (this file's fetchTranslations()) is kept only as a
 * fallback — used when there's no key, the api.bible request fails, or the
 * key currently has zero Bibles approved.
 */
export async function fetchPrimaryTranslations(): Promise<TranslationSourceResult> {
  if (hasScriptureApiKey()) {
    const bibles = await fetchScriptureApiBibles().catch(() => []);
    if (bibles.length > 0) {
      return { source: "api.bible", groups: groupScriptureApiBibles(bibles), stale: false };
    }
  }
  try {
    const groups = await fetchTranslations();
    return { source: "bolls", groups, stale: false };
  } catch {
    return { source: "bolls", groups: FALLBACK_GROUPS, stale: true };
  }
}

/**
 * Resolve a translation code to an api.bible Bible id, if your key has
 * access to a Bible with that abbreviation. The requested code is matched
 * against both the raw abbreviation ("ENGKJV") and its normalized form
 * ("KJV" — what the picker/URLs use); an exact raw match wins when both
 * exist. Returns null when API_BIBLE_KEY isn't set, or the code isn't
 * among the Bibles your key can see — in both cases the caller falls back
 * to Bolls.life.
 */
async function resolveScriptureApiBibleId(translation: string): Promise<string | null> {
  if (!hasScriptureApiKey()) return null;
  const requested = translation.toUpperCase();
  const bibles = await fetchScriptureApiBibles();
  const rawMatch = bibles.find((b) => b.abbreviation.toUpperCase() === requested);
  if (rawMatch) return rawMatch.id;
  const normalizedMatch = bibles.find(
    (b) => normalizeTranslationCode(b.abbreviation, b.language) === requested
  );
  return normalizedMatch?.id ?? null;
}

/**
 * Read-through cache: on a successful fetch, persist the cleaned verse list
 * so a later provider outage doesn't take down a chapter someone already
 * read. On failure, fall back to whatever we last cached (if anything).
 * Tries api.bible first when the translation code matches a Bible your
 * API_BIBLE_KEY has access to; a failed or empty api.bible fetch still
 * falls through to Bolls.life before giving up — a code both providers
 * carry (like KJV) should never dead-end on an api.bible hiccup.
 */
export async function fetchChapter(
  translation: string,
  book: number,
  chapter: number
): Promise<BollsVerse[]> {
  async function fetchFromBolls(): Promise<BollsVerse[]> {
    const res = await fetch(
      `${BOLLS_BASE}/get-text/${translation}/${book}/${chapter}/`,
      FETCH_OPTIONS
    );
    if (!res.ok) throw new Error(`Failed to fetch ${translation} ${book}:${chapter}`);
    const raw = (await res.json()) as BollsVerse[];
    return raw.map((v) => ({ ...v, text: cleanVerseText(v.text) }));
  }

  try {
    const scriptureApiBibleId = await resolveScriptureApiBibleId(translation);
    let verses: BollsVerse[] = [];
    if (scriptureApiBibleId) {
      verses = await fetchScriptureApiChapter(scriptureApiBibleId, book, chapter).catch(
        () => []
      );
    }
    if (verses.length === 0) {
      verses = await fetchFromBolls();
    }
    if (verses.length > 0) {
      const versesJson = verses as unknown as Prisma.InputJsonValue;
      await db.chapterCache
        .upsert({
          where: { translation_book_chapter: { translation, book, chapter } },
          create: { translation, book, chapter, verses: versesJson },
          update: { verses: versesJson, fetchedAt: new Date() },
        })
        .catch(() => {});
    }
    return verses;
  } catch (err) {
    const cached = await db.chapterCache
      .findUnique({ where: { translation_book_chapter: { translation, book, chapter } } })
      .catch(() => null);
    if (cached) return cached.verses as unknown as BollsVerse[];
    throw err;
  }
}

export interface StrongsToken {
  word: string;
  strongs: string[]; // e.g. ["G1722"] or ["H7225"]
}

/**
 * Fetch a chapter from bolls.life's KJV, which carries Strong's concordance
 * numbers (<S>1722</S>) for the whole Bible. Text is intentionally NOT cleaned
 * so the Strong's tags can be parsed for word study.
 */
export async function fetchStrongsChapter(
  book: number,
  chapter: number
): Promise<BollsVerse[]> {
  const res = await fetch(
    `${BOLLS_BASE}/get-text/KJV/${book}/${chapter}/`,
    FETCH_OPTIONS
  );
  if (!res.ok) throw new Error(`Failed to fetch Strong's ${book}:${chapter}`);
  return res.json();
}

/**
 * Parse a Strong's-tagged verse into word tokens. OT books (1–39) use Hebrew
 * numbers (H prefix); NT books (40–66) use Greek (G prefix).
 */
export function parseStrongs(rawText: string, testament: "OT" | "NT"): StrongsToken[] {
  const prefix = testament === "OT" ? "H" : "G";
  const text = rawText.replace(/<sup>.*?<\/sup>/g, ""); // drop footnotes
  const tokens: StrongsToken[] = [];

  for (const chunk of text.split(/\s+/)) {
    if (!chunk) continue;
    const numbers = [...chunk.matchAll(/<S>(\d+)<\/S>/g)].map((m) => prefix + m[1]);
    const word = chunk
      .replace(/<S>\d+<\/S>/g, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!word && numbers.length === 0) continue;
    tokens.push({ word, strongs: numbers });
  }

  return tokens;
}

export async function searchBible(
  translation: string,
  query: string
): Promise<BollsSearchResult[]> {
  // api.bible first when the code belongs to it; any failure there falls
  // through to the Bolls path below.
  const scriptureApiBibleId = await resolveScriptureApiBibleId(translation).catch(() => null);
  if (scriptureApiBibleId) {
    try {
      return await searchScriptureApi(scriptureApiBibleId, query);
    } catch {
      // fall through to Bolls
    }
  }

  const encoded = encodeURIComponent(query);
  const res = await fetch(
    `${BOLLS_BASE}/search/${translation}/${encoded}/`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return (data as BollsSearchResult[]).map((r) => ({
    ...r,
    text: cleanVerseText(r.text),
  }));
}

export async function fetchBookList(
  translation: string
): Promise<Array<{ bookid: number; name: string; chapters: number }>> {
  try {
    const res = await fetch(
      `${BOLLS_BASE}/get-book-list/${translation}/`,
      FETCH_OPTIONS
    );
    if (!res.ok) throw new Error(`Failed to fetch book list for ${translation}`);
    const books = await res.json();
    if (Array.isArray(books) && books.length > 0) {
      await db.bookListCache
        .upsert({
          where: { translation },
          create: { translation, books },
          update: { books, fetchedAt: new Date() },
        })
        .catch(() => {});
    }
    return books;
  } catch {
    const cached = await db.bookListCache.findUnique({ where: { translation } }).catch(() => null);
    return cached ? (cached.books as unknown as Array<{ bookid: number; name: string; chapters: number }>) : [];
  }
}

// Ordered list of English translation codes to pin at the top of selectors
// (in display order). Resolved by intersection against the live list —
// whichever provider supplied it — so codes the current source doesn't
// carry simply don't appear. KJV stays first (the app default); modern
// translations (available via api.bible once the publisher grants them to
// your key, or via Bolls' live list) come right after.
export const FEATURED_TRANSLATION_CODES = [
  "KJV", "NIV", "ESV", "NLT", "CSB", "NASB", "AMP", "MSG",
  "NKJV", "BSB", "WEB", "ASV", "FBV", "LSV",
  "YLT", "BBE", "DBY", "WBS",
  "LITV", "MKJV", "NHEB", "RNKJV", "NMB", "TMB", "TYN", "WEBBE",
  "NET", "RV", "ISV", "AKJV", "KJ2000", "CKJV", "KJV1611", "LXXE",
];

// Used when the Bolls.life API is unreachable from the server.
// Organised as language groups so the selector can display them correctly.
export const FALLBACK_GROUPS: BollsLanguageGroup[] = [
  {
    language: "English",
    translations: [
      { short_name: "KJV",    full_name: "King James Version",                   language: "English" },
      { short_name: "NKJV",   full_name: "New King James Version",               language: "English" },
      { short_name: "WEB",    full_name: "World English Bible",                  language: "English" },
      { short_name: "ASV",    full_name: "American Standard Version",            language: "English" },
      { short_name: "YLT",    full_name: "Young's Literal Translation",          language: "English" },
      { short_name: "BBE",    full_name: "Bible in Basic English",               language: "English" },
      { short_name: "DBY",    full_name: "Darby Translation",                    language: "English" },
      { short_name: "WBS",    full_name: "Webster's Bible (1833)",               language: "English" },
      { short_name: "LITV",   full_name: "Green's Literal Translation",          language: "English" },
      { short_name: "MKJV",   full_name: "Modern King James Version",            language: "English" },
      { short_name: "NHEB",   full_name: "New Heart English Bible",              language: "English" },
      { short_name: "RNKJV",  full_name: "Restored Name King James Version",     language: "English" },
      { short_name: "NMB",    full_name: "New Matthew Bible",                    language: "English" },
      { short_name: "TMB",    full_name: "Third Millennium Bible",               language: "English" },
      { short_name: "TYN",    full_name: "Tyndale Bible (1526)",                 language: "English" },
      { short_name: "WEBBE",  full_name: "World English Bible, British Edition", language: "English" },
      { short_name: "NET",    full_name: "New English Translation",              language: "English" },
      { short_name: "RV",     full_name: "Revised Version (1885)",               language: "English" },
      { short_name: "ISV",    full_name: "International Standard Version",       language: "English" },
      { short_name: "AKJV",   full_name: "Authorized King James Version",        language: "English" },
      { short_name: "KJ2000", full_name: "King James 2000",                      language: "English" },
      { short_name: "CKJV",   full_name: "Conservative King James Version",      language: "English" },
      { short_name: "KJV1611",full_name: "King James Version (1611)",            language: "English" },
      { short_name: "LXXE",   full_name: "Septuagint (English)",                 language: "English" },
    ],
  },
  {
    language: "Spanish",
    translations: [
      { short_name: "RVR60",  full_name: "Reina-Valera 1960",                    language: "Spanish" },
      { short_name: "NVI",    full_name: "Nueva Versión Internacional",           language: "Spanish" },
      { short_name: "RVC",    full_name: "Reina Valera Contemporánea",            language: "Spanish" },
      { short_name: "BTX",    full_name: "La Biblia Textual",                     language: "Spanish" },
      { short_name: "LBLA",   full_name: "La Biblia de las Américas",             language: "Spanish" },
      { short_name: "PDT",    full_name: "Palabra de Dios para Todos",            language: "Spanish" },
      { short_name: "RV1909", full_name: "Reina-Valera 1909",                     language: "Spanish" },
    ],
  },
  {
    language: "French",
    translations: [
      { short_name: "LSG",    full_name: "Louis Segond (1910)",                   language: "French" },
      { short_name: "NEG",    full_name: "Nouvelle Édition de Genève",            language: "French" },
      { short_name: "BDS",    full_name: "Bible du Semeur",                       language: "French" },
      { short_name: "S21",    full_name: "Segond 21",                             language: "French" },
    ],
  },
  {
    language: "German",
    translations: [
      { short_name: "LUT",    full_name: "Luther Bibel (1912)",                   language: "German" },
      { short_name: "ELB",    full_name: "Elberfelder Bibel",                     language: "German" },
      { short_name: "HFA",    full_name: "Hoffnung für Alle",                     language: "German" },
    ],
  },
  {
    language: "Portuguese",
    translations: [
      { short_name: "ARC",    full_name: "Almeida Revista e Corrigida",           language: "Portuguese" },
      { short_name: "ACF",    full_name: "Almeida Corrigida Fiel",                language: "Portuguese" },
    ],
  },
  {
    language: "Russian",
    translations: [
      { short_name: "SYNODAL", full_name: "Synodal Bible",                        language: "Russian" },
    ],
  },
  {
    language: "Chinese",
    translations: [
      { short_name: "CNVS",   full_name: "Chinese New Version (Simplified)",      language: "Chinese" },
      { short_name: "CNVT",   full_name: "Chinese New Version (Traditional)",     language: "Chinese" },
      { short_name: "CUV",    full_name: "Chinese Union Version",                 language: "Chinese" },
    ],
  },
  {
    language: "Korean",
    translations: [
      { short_name: "KRV",    full_name: "Korean Revised Version",                language: "Korean" },
    ],
  },
  {
    language: "Arabic",
    translations: [
      { short_name: "SVD",    full_name: "Smith & Van Dyke",                      language: "Arabic" },
      { short_name: "NAV",    full_name: "New Arabic Version",                    language: "Arabic" },
    ],
  },
];

// Flat English list derived from FALLBACK_GROUPS for places that only need English.
export const FALLBACK_TRANSLATIONS: BollsTranslation[] =
  FALLBACK_GROUPS.find((g) => g.language === "English")?.translations ?? [];
