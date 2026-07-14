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
  verseEnd: number | null;
}

// Captures generously — up to four book-name words (so "Song of Solomon"
// fits, and prose words before a book name are tolerated), the chapter, and
// an optional verse spec with ranges and comma lists (":16-18, 22").
// The captured words are resolved against the alias map by LONGEST SUFFIX
// first, so "love God John 3:16" resolves via the "john" suffix instead of
// failing on "love god john" and silently consuming the reference.
const REF_REGEX =
  /\b((?:[123]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d{1,3})\b((?::\d{1,3}(?:\s*[-–]\s*\d{1,3})?)(?:\s*,\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?)*)?/g;

interface VerseSegment {
  verse: number;
  verseEnd: number | null;
}

function parseVerseSpec(spec: string | undefined): VerseSegment[] | null {
  if (!spec) return null;
  const segments: VerseSegment[] = [];
  for (const part of spec.replace(/^:/, "").split(/\s*,\s*/)) {
    const [startStr, endStr] = part.split(/\s*[-–]\s*/);
    const verse = parseInt(startStr, 10);
    if (!Number.isInteger(verse) || verse < 1) continue;
    let verseEnd: number | null = endStr ? parseInt(endStr, 10) : null;
    if (verseEnd !== null && (!Number.isInteger(verseEnd) || verseEnd <= verse)) {
      verseEnd = null;
    }
    segments.push({ verse, verseEnd });
  }
  return segments.length > 0 ? segments : null;
}

export function detectScriptureRefs(text: string): DetectedRef[] {
  const seen = new Set<string>();
  const results: DetectedRef[] = [];
  let m: RegExpExecArray | null;
  REF_REGEX.lastIndex = 0;

  while ((m = REF_REGEX.exec(text)) !== null) {
    const words = m[1].trim().toLowerCase().split(/\s+/);

    // Longest suffix first: "verse 1 john" → "1 john"; "love god john" → "john"
    let bookId: number | undefined;
    for (let start = 0; start < words.length; start++) {
      const candidate = words.slice(start).join(" ");
      const id = ALIAS_MAP.get(candidate);
      if (id) {
        bookId = id;
        break;
      }
    }

    const chapter = parseInt(m[2], 10);
    const bookInfo = bookId ? BIBLE_BOOKS.find((b) => b.id === bookId) : undefined;

    if (!bookInfo || chapter < 1 || chapter > bookInfo.chapters) {
      // Don't let a failed match swallow the text it consumed — a numbered
      // book right after prose ("love God 1 John 3:16") would otherwise lose
      // its leading digit. Resume just past the first captured word.
      REF_REGEX.lastIndex = m.index + Math.max(words[0].length, 1);
      continue;
    }

    const segments = parseVerseSpec(m[3]) ?? [{ verse: null, verseEnd: null }];
    for (const seg of segments) {
      const verse = seg.verse as number | null;
      const verseEnd = seg.verseEnd ?? null;
      const key = `${bookInfo.id}:${chapter}:${verse ?? 0}${verseEnd ? `-${verseEnd}` : ""}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        key,
        display: `${bookInfo.name} ${chapter}${verse ? `:${verse}` : ""}${verseEnd ? `-${verseEnd}` : ""}`,
        book: bookInfo.id,
        chapter,
        verse,
        verseEnd,
      });
    }
  }

  return results;
}
