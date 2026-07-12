import { fetchChapter } from "@/lib/bible-api";
import { stripParagraphMark } from "@/lib/bible-structure";
import { getBook } from "@/lib/bible-books";
import { todaysReference } from "@/lib/votd-schedule";

export interface VerseOfTheDay {
  book: number;
  chapter: number;
  verse: number;
  bookName: string;
  reference: string;
  text: string;
}

export { todaysReference };

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
