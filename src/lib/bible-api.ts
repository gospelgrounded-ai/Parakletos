import { db } from "@/lib/db";

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

/**
 * Some bolls.life translations (notably KJV and ASV) are served as the
 * Strong's-tagged variant, so verse text contains inline markup:
 *   - <S>1722</S>  Strong's concordance numbers
 *   - <sup>...</sup>  translator footnotes
 *   - <i>was</i>  italicized supplied words
 * Strip the numbers and notes, keep the readable words, tidy whitespace.
 */
export function cleanVerseText(raw: string): string {
  return raw
    .replace(/<S>.*?<\/S>/g, "") // Strong's numbers (remove with content)
    .replace(/<sup>.*?<\/sup>/g, "") // translator footnotes (remove with content)
    .replace(/<[^>]+>/g, "") // any remaining tags (<i>, <b>, <br/>) — keep inner text
    .replace(/\s+/g, " ") // collapse whitespace left behind
    .replace(/\s+([,.;:!?’”)])/g, "$1") // tidy stray space before punctuation
    .trim();
}

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
  if (Array.isArray(data)) return data;
  return Object.entries(data).map(([language, translations]) => ({
    language,
    translations: (translations as BollsTranslation[]) || [],
  }));
}

/**
 * Read-through cache: on a successful Bolls fetch, persist the cleaned verse
 * list so a later Bolls outage doesn't take down a chapter someone already
 * read. On failure, fall back to whatever we last cached (if anything).
 */
export async function fetchChapter(
  translation: string,
  book: number,
  chapter: number
): Promise<BollsVerse[]> {
  try {
    const res = await fetch(
      `${BOLLS_BASE}/get-text/${translation}/${book}/${chapter}/`,
      FETCH_OPTIONS
    );
    if (!res.ok) throw new Error(`Failed to fetch ${translation} ${book}:${chapter}`);
    const raw = (await res.json()) as BollsVerse[];
    const verses = raw.map((v) => ({ ...v, text: cleanVerseText(v.text) }));
    if (verses.length > 0) {
      await db.chapterCache
        .upsert({
          where: { translation_book_chapter: { translation, book, chapter } },
          create: { translation, book, chapter, verses },
          update: { verses, fetchedAt: new Date() },
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

// Ordered list of English translation codes to pin at the top of selectors.
// Resolved against the live Bolls.life list when available; full names come
// from FALLBACK_TRANSLATIONS below when the API is unreachable.
// English translations to pin at the top of the selector (in display order).
export const FEATURED_TRANSLATION_CODES = [
  "KJV", "NKJV", "WEB", "ASV", "YLT", "BBE", "DBY", "WBS",
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
