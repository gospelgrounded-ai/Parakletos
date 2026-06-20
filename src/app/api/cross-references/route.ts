import { NextResponse } from "next/server";
import { fetchChapter } from "@/lib/bible-api";
import { getBook } from "@/lib/bible-books";
import crossRefsData from "@/data/cross-references.json";

// Treasury of Scripture Knowledge cross-references (openbible.info, CC-BY).
// Keyed "book-chapter-verse" → array of targets [book, chapter, verse, endVerse?]
// already sorted by relevance (votes), capped at the top 10 per verse.
const CROSS_REFS = crossRefsData as Record<string, number[][]>;

interface ResolvedRef {
  book: number;
  chapter: number;
  verse: number;
  endVerse: number | null;
  reference: string;
  text: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  const verse = searchParams.get("verse");
  const translation = (searchParams.get("translation") ?? "KJV").toUpperCase();

  if (!book || !chapter || !verse) {
    return NextResponse.json({ refs: [] });
  }

  const key = `${book}-${chapter}-${verse}`;
  const targets = CROSS_REFS[key] ?? [];

  if (targets.length === 0) {
    return NextResponse.json({ refs: [] });
  }

  // Group targets by book+chapter so each chapter is fetched only once.
  const chapterKeys = new Set(targets.map((t) => `${t[0]}-${t[1]}`));
  const chapterCache = new Map<string, Awaited<ReturnType<typeof fetchChapter>>>();

  await Promise.all(
    [...chapterKeys].map(async (ck) => {
      const [b, c] = ck.split("-").map(Number);
      try {
        chapterCache.set(ck, await fetchChapter(translation, b, c));
      } catch {
        chapterCache.set(ck, []);
      }
    })
  );

  const refs: ResolvedRef[] = targets.map((t) => {
    const [b, c, v, e] = t;
    const endVerse = e ?? null;
    const verses = chapterCache.get(`${b}-${c}`) ?? [];

    let text: string;
    if (endVerse) {
      text = verses
        .filter((row) => row.verse >= v && row.verse <= endVerse)
        .map((row) => row.text)
        .join(" ");
    } else {
      text = verses.find((row) => row.verse === v)?.text ?? "";
    }

    const bookInfo = getBook(b);
    const name = bookInfo?.name ?? `Book ${b}`;
    const reference = endVerse ? `${name} ${c}:${v}-${endVerse}` : `${name} ${c}:${v}`;

    return { book: b, chapter: c, verse: v, endVerse, reference, text };
  });

  return NextResponse.json(
    { refs },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
