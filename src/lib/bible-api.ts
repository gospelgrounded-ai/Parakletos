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

// Popular translations displayed prominently
export const FEATURED_TRANSLATIONS = [
  { short_name: "KJV", full_name: "King James Version", language: "English" },
  { short_name: "NKJV", full_name: "New King James Version", language: "English" },
  { short_name: "WEB", full_name: "World English Bible", language: "English" },
  { short_name: "ASV", full_name: "American Standard Version", language: "English" },
  { short_name: "YLT", full_name: "Young's Literal Translation", language: "English" },
];
