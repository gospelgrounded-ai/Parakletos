import { BIBLE_BOOKS } from "@/lib/bible-books";

const EXTRA_ALIASES: Record<string, number> = {
  // Common abbreviations / variants not covered by shortName or full name
  "ps": 19, "psalm": 19, "psalms": 19,
  "prov": 20, "pv": 20,
  "eccl": 21, "ec": 21, "qoh": 21,
  "song": 22, "sos": 22, "ss": 22, "song of songs": 22,
  "isa": 23, "ezek": 26, "ez": 26,
  "1 cor": 46, "2 cor": 47,
  "1 thess": 52, "1 thes": 52, "2 thess": 53, "2 thes": 53,
  "1 tim": 54, "2 tim": 55,
  "phil": 50, "php": 50, "col": 51, "phm": 57,
  "heb": 58, "jas": 59,
  "1 pet": 60, "1 pe": 60, "2 pet": 61, "2 pe": 61,
  "1 jn": 62, "2 jn": 63, "3 jn": 64,
  "rev": 66, "mt": 40, "matt": 40,
  "mk": 41, "lk": 42, "jn": 43, "ac": 44,
  "ro": 45, "gal": 48, "eph": 49,
};

function buildAliasMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const book of BIBLE_BOOKS) {
    map.set(book.name.toLowerCase(), book.id);
    map.set(book.shortName.toLowerCase(), book.id);
  }
  for (const [alias, id] of Object.entries(EXTRA_ALIASES)) {
    map.set(alias, id);
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

export interface DetectedRef {
  key: string;
  display: string;
  book: number;
  chapter: number;
  verse: number | null;
}

// Matches: optional leading digit ("1 ", "2 ", "3 "), one or two word book name, chapter, optional :verse
const REF_REGEX = /\b((?:[123]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)(?::(\d+))?/g;

export function detectScriptureRefs(text: string): DetectedRef[] {
  const seen = new Set<string>();
  const results: DetectedRef[] = [];
  let m: RegExpExecArray | null;
  REF_REGEX.lastIndex = 0;

  while ((m = REF_REGEX.exec(text)) !== null) {
    const rawBook = m[1].trim().toLowerCase();
    const chapter = parseInt(m[2], 10);
    const verse = m[3] ? parseInt(m[3], 10) : null;

    const bookId = ALIAS_MAP.get(rawBook);
    if (!bookId) continue;

    const bookInfo = BIBLE_BOOKS.find((b) => b.id === bookId);
    if (!bookInfo) continue;
    if (chapter < 1 || chapter > bookInfo.chapters) continue;

    const key = `${bookId}:${chapter}:${verse ?? 0}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      key,
      display: `${bookInfo.name} ${chapter}${verse ? `:${verse}` : ""}`,
      book: bookId,
      chapter,
      verse,
    });
  }

  return results;
}
