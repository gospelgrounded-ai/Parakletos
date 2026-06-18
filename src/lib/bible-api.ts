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
  return res.json();
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
  return Array.isArray(data) ? data : [];
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
  { short_name: "BBE", full_name: "Bible in Basic English", language: "English" },
];
