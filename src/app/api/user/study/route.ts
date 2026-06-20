import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fetchChapter } from "@/lib/bible-api";
import { getBook } from "@/lib/bible-books";

// Unified "study workspace" feed: every highlight, bookmark, and note the user
// has saved, enriched with the actual verse text so the Library can show what
// was marked (not just a reference). Verse text is resolved by fetching each
// referenced chapter once (fetchChapter is cached + deduped).

interface SavedRow {
  id: string;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  createdAt: Date;
}

function enrich(
  row: SavedRow,
  cache: Map<string, Awaited<ReturnType<typeof fetchChapter>>>,
  extra: Record<string, unknown>
) {
  const bookName = getBook(row.book)?.name ?? `Book ${row.book}`;
  const verses = cache.get(`${row.translation}|${row.book}|${row.chapter}`) ?? [];
  const text = verses.find((v) => v.verse === row.verse)?.text ?? "";
  return {
    id: row.id,
    translation: row.translation,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    bookName,
    reference: `${bookName} ${row.chapter}:${row.verse}`,
    text,
    createdAt: row.createdAt,
    ...extra,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const order = [{ book: "asc" }, { chapter: "asc" }, { verse: "asc" }] as const;
    const [highlights, bookmarks, notes] = await Promise.all([
      db.highlight.findMany({ where: { userId }, orderBy: [...order] }),
      db.bookmark.findMany({ where: { userId }, orderBy: [...order] }),
      db.note.findMany({ where: { userId }, orderBy: [...order] }),
    ]);

    // Collect every distinct translation/book/chapter we need text for.
    const chapterKeys = new Set<string>();
    for (const row of [...highlights, ...bookmarks, ...notes]) {
      chapterKeys.add(`${row.translation}|${row.book}|${row.chapter}`);
    }

    const cache = new Map<string, Awaited<ReturnType<typeof fetchChapter>>>();
    await Promise.all(
      [...chapterKeys].map(async (key) => {
        const [t, b, c] = key.split("|");
        try {
          cache.set(key, await fetchChapter(t, Number(b), Number(c)));
        } catch {
          cache.set(key, []);
        }
      })
    );

    return NextResponse.json({
      highlights: highlights.map((h) => enrich(h, cache, { color: h.color })),
      bookmarks: bookmarks.map((b) => enrich(b, cache, { label: b.label })),
      notes: notes.map((n) => enrich(n, cache, { content: n.content })),
    });
  } catch (error) {
    console.error("[USER_STUDY_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
