import votdList from "@/data/votd.json";
import { fetchChapter } from "@/lib/bible-api";
import { stripParagraphMark } from "@/lib/bible-structure";
import { getBook } from "@/lib/bible-books";

export interface VerseOfTheDay {
  book: number;
  chapter: number;
  verse: number;
  bookName: string;
  reference: string;
  text: string;
}

const VOTD_LIST = votdList as Array<{ book: number; chapter: number; verse: number }>;

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff =
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  return Math.floor(diff / 86_400_000);
}

/** Deterministic pick by day-of-year, cycling through the curated list. */
export function todaysReference(date: Date = new Date()): {
  book: number;
  chapter: number;
  verse: number;
} {
  const idx = (dayOfYear(date) - 1 + VOTD_LIST.length) % VOTD_LIST.length;
  return VOTD_LIST[idx];
}

export async function getVerseOfTheDay(
  translation = "KJV",
  date: Date = new Date()
): Promise<VerseOfTheDay | null> {
  const ref = todaysReference(date);
  const bookInfo = getBook(ref.book);
  if (!bookInfo) return null;

  try {
    const verses = await fetchChapter(translation, ref.book, ref.chapter);
    const target = verses.find((v) => v.verse === ref.verse);
    if (!target) return null;
    return {
      book: ref.book,
      chapter: ref.chapter,
      verse: ref.verse,
      bookName: bookInfo.name,
      reference: `${bookInfo.name} ${ref.chapter}:${ref.verse}`,
      text: stripParagraphMark(target.text),
    };
  } catch {
    return null;
  }
}
