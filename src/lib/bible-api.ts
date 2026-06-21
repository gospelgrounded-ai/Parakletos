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
  next: { revalidate: 86400 },
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
    FETCH_OPTIONS
  );
  if (!res.ok) throw new Error("Failed to fetch translations");
  const data = await res.json();
  // bolls.life returns an object with language keys
  if (Array.isArray(data)) return data;
  // Transform object format to array
  return Object.entries(data).map(([language, translations]) => ({
    language,
    translations: (translations as BollsTranslation[]) || [],
  }));
}

export async function fetchChapter(
  translation: string,
  book: number,
  chapter: number
): Promise<BollsVerse[]> {
  const res = await fetch(
    `${BOLLS_BASE}/get-text/${translation}/${book}/${chapter}/`,
    FETCH_OPTIONS
  );
  if (!res.ok) throw new Error(`Failed to fetch ${translation} ${book}:${chapter}`);
  const verses = (await res.json()) as BollsVerse[];
  return verses.map((v) => ({ ...v, text: cleanVerseText(v.text) }));
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
  const res = await fetch(
    `${BOLLS_BASE}/get-book-list/${translation}/`,
    FETCH_OPTIONS
  );
  if (!res.ok) return [];
  return res.json();
}

// Ordered list of English translation codes to pin at the top of selectors.
// Resolved against the live Bolls.life list — codes absent from Bolls.life
// simply won't appear. Full names come from the API, not hardcoded here.
export const FEATURED_TRANSLATION_CODES = [
  "KJV", "WEB", "ASV", "YLT", "BBE", "DBY", "WBS",
  "LITV", "MKJV", "NHEB", "RNKJV", "TMB", "TYN", "WEBBE",
  "NET", "RV", "ISV",
];

// Minimal fallback used when the Bolls.life translations API is unreachable.
export const FALLBACK_TRANSLATIONS: BollsTranslation[] = [
  { short_name: "KJV",  full_name: "King James Version",          language: "English" },
  { short_name: "WEB",  full_name: "World English Bible",         language: "English" },
  { short_name: "ASV",  full_name: "American Standard Version",   language: "English" },
  { short_name: "YLT",  full_name: "Young's Literal Translation", language: "English" },
  { short_name: "BBE",  full_name: "Bible in Basic English",      language: "English" },
];
