import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  const interlinearMode = resolvedSearch.interlinear === "1";
  const parallelTranslation =
    !interlinearMode &&
    typeof resolvedSearch.parallel === "string" &&
    resolvedSearch.parallel.length <= 10
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
  let translationUnavailable = false;
  try {
    verses = await fetchChapter(translation.toUpperCase(), bookNum, chapterNum);
  } catch {
    translationUnavailable = true;
  }

  if (!verses || verses.length === 0) translationUnavailable = true;

  if (translationUnavailable) {
    // Offer translations we actually have this exact chapter cached for
    // (survives a Bolls.life outage), falling back to a best guess.
    const translationUpper = translation.toUpperCase();
    const cached = await db.chapterCache
      .findMany({
        where: { book: bookNum, chapter: chapterNum, translation: { not: translationUpper } },
        select: { translation: true },
        distinct: ["translation"],
        orderBy: { translation: "asc" },
      })
      .catch(() => []);
    const suggestions =
      cached.length > 0 ? cached.map((c) => c.translation) : ["KJV", "WEB"];

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <p className="text-4xl">📖</p>
        <h1 className="text-xl font-semibold">Translation unavailable</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          <strong>{translationUpper}</strong> could not be loaded for{" "}
          {bookInfo.name} {chapterNum}. It may be temporarily unavailable on
          Bolls.life, or the translation code may have changed.
        </p>
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          {suggestions.slice(0, 4).map((t, i) => (
            <Link
              key={t}
              href={`/bible/${t}/${bookNum}/${chapterNum}`}
              className={
                i === 0
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  : "rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              }
            >
              Read in {t}
            </Link>
          ))}
        </div>
      </div>
    );
  }

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
      interlinearMode={interlinearMode}
      isAuthenticated={!!session?.user?.id}
    />
  );
}
