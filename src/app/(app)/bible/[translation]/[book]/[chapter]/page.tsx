import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fetchChapter } from "@/lib/bible-api";
import { getBook } from "@/lib/bible-books";
import BibleReaderClient from "@/components/bible/BibleReaderClient";

type PageParams = { translation: string; book: string; chapter: string };
type PageSearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { translation, book, chapter } = await params;
  const bookInfo = getBook(Number(book));
  return {
    title: `${bookInfo?.name ?? "Bible"} ${chapter} — ${translation.toUpperCase()}`,
  };
}

export default async function BibleChapterPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { translation, book: bookParam, chapter: chapterParam } = await params;
  const resolvedSearch = await searchParams;
  const parallelTranslation =
    typeof resolvedSearch.parallel === "string" && resolvedSearch.parallel.length <= 10
      ? resolvedSearch.parallel.toUpperCase()
      : undefined;

  const bookNum = parseInt(bookParam, 10);
  const chapterNum = parseInt(chapterParam, 10);

  if (isNaN(bookNum) || isNaN(chapterNum) || bookNum < 1 || bookNum > 66) {
    notFound();
  }

  const bookInfo = getBook(bookNum);
  if (!bookInfo) notFound();

  if (chapterNum < 1 || chapterNum > bookInfo.chapters) {
    notFound();
  }

  // Fetch Bible text (server-side, cached by bolls.life)
  let verses: Array<{ pk: number; verse: number; text: string }> = [];
  try {
    verses = await fetchChapter(translation.toUpperCase(), bookNum, chapterNum);
  } catch {
    notFound();
  }

  if (!verses || verses.length === 0) notFound();

  // Fetch user annotations (only if logged in)
  const session = await auth();

  let initialHighlights: Array<{ id: string; verse: number; color: string }> = [];
  let initialBookmarks: Array<{ id: string; verse: number; label?: string | null }> = [];
  let initialNotes: Array<{ id: string; verse: number; content: string }> = [];

  if (session?.user?.id) {
    const userId = session.user.id;
    const translationUpper = translation.toUpperCase();

    const [highlights, bookmarks, notes] = await Promise.all([
      db.highlight.findMany({
        where: { userId, translation: translationUpper, book: bookNum, chapter: chapterNum },
        select: { id: true, verse: true, color: true },
        orderBy: { verse: "asc" },
      }),
      db.bookmark.findMany({
        where: { userId, translation: translationUpper, book: bookNum, chapter: chapterNum },
        select: { id: true, verse: true, label: true },
        orderBy: { verse: "asc" },
      }),
      db.note.findMany({
        where: { userId, translation: translationUpper, book: bookNum, chapter: chapterNum },
        select: { id: true, verse: true, content: true },
        orderBy: { verse: "asc" },
      }),
    ]);

    initialHighlights = highlights;
    initialBookmarks = bookmarks;
    initialNotes = notes;
  }

  return (
    <BibleReaderClient
      verses={verses}
      translation={translation.toUpperCase()}
      book={bookNum}
      chapter={chapterNum}
      initialHighlights={initialHighlights}
      initialBookmarks={initialBookmarks}
      initialNotes={initialNotes}
      parallelTranslation={parallelTranslation}
    />
  );
}
