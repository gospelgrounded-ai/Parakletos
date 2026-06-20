import { NextResponse } from "next/server";
import { getBook } from "@/lib/bible-books";

const HELLOAO_BASE = "https://bible.helloao.org";
const FETCH_OPTS = { next: { revalidate: 86400 } } as const;

interface HellaoCommentary {
  id: string;
  name: string;
  englishName: string;
  language: string;
  numberOfBooks: number;
}

interface HellaoBook {
  id: string;
  commonName: string;
  order: number;
  numberOfChapters: number;
}

type ContentItem = string | { text: string } | { heading: string } | { lineBreak: boolean } | unknown;

interface HellaoVerseEntry {
  type: "verse";
  number: number;
  content: ContentItem[];
}

interface HellaoChapterData {
  number: number;
  introduction?: string | null;
  content: HellaoVerseEntry[];
}

async function fetchAvailableCommentaries(): Promise<HellaoCommentary[]> {
  try {
    const res = await fetch(`${HELLOAO_BASE}/api/available_commentaries.json`, FETCH_OPTS);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.commentaries ?? []) as HellaoCommentary[];
  } catch {
    return [];
  }
}

async function fetchCommentaryBooks(commentaryId: string): Promise<HellaoBook[]> {
  try {
    const res = await fetch(`${HELLOAO_BASE}/api/c/${commentaryId}/books.json`, FETCH_OPTS);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.books ?? []) as HellaoBook[];
  } catch {
    return [];
  }
}

async function fetchCommentaryChapter(
  commentaryId: string,
  bookId: string,
  chapter: number
): Promise<HellaoChapterData | null> {
  try {
    const res = await fetch(
      `${HELLOAO_BASE}/api/c/${commentaryId}/${bookId}/${chapter}.json`,
      FETCH_OPTS
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.chapter ?? null) as HellaoChapterData | null;
  } catch {
    return null;
  }
}

function extractText(content: ContentItem[]): string {
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        if ("text" in item) return (item as { text: string }).text;
      }
      return "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

// Preferred commentary IDs from bible.helloao.org (public domain, English)
const PREFERRED_IDS = ["mhc", "acc", "bsc", "gill", "jfb"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = Number(searchParams.get("book"));
  const chapter = Number(searchParams.get("chapter"));

  if (!book || !chapter) {
    return NextResponse.json({ commentaries: [] });
  }

  const bookInfo = getBook(book);
  if (!bookInfo) {
    return NextResponse.json({ commentaries: [] });
  }

  try {
    const allCommentaries = await fetchAvailableCommentaries();

    // Select up to 3 English commentaries, preferring well-known ones
    const preferred = PREFERRED_IDS
      .map((id) => allCommentaries.find((c) => c.id === id))
      .filter(Boolean) as HellaoCommentary[];

    const others = allCommentaries.filter(
      (c) => (c.language === "eng" || c.language === "en") && !PREFERRED_IDS.includes(c.id)
    );

    const selected = [...preferred, ...others].slice(0, 3);

    const results = await Promise.all(
      selected.map(async (commentary) => {
        const books = await fetchCommentaryBooks(commentary.id);

        // Match by order (1-indexed book number) or by common name
        const bookEntry =
          books.find((b) => b.order === book) ??
          books.find(
            (b) =>
              b.commonName.toLowerCase() === bookInfo.name.toLowerCase() ||
              b.commonName.toLowerCase() === bookInfo.shortName.toLowerCase()
          );

        if (!bookEntry) return null;

        const chapterData = await fetchCommentaryChapter(commentary.id, bookEntry.id, chapter);
        if (!chapterData) return null;

        const verses = chapterData.content
          .filter((c) => c.type === "verse")
          .map((c) => ({
            verse: c.number,
            text: extractText(c.content),
          }))
          .filter((v) => v.text.length > 10);

        if (verses.length === 0 && !chapterData.introduction) return null;

        return {
          id: commentary.id,
          name: commentary.englishName,
          introduction: chapterData.introduction ?? null,
          verses,
        };
      })
    );

    const commentaries = results.filter(Boolean);

    return NextResponse.json(
      { commentaries },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json({ commentaries: [], error: "fetch_failed" });
  }
}
