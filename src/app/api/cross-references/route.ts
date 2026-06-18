import { NextResponse } from "next/server";
import { fetchChapter } from "@/lib/bible-api";

// A small set of hardcoded cross-references for demonstration.
// In production, load from a bundled JSON dataset (OpenBible TSK).
const CROSS_REFS: Record<string, Array<{ book: number; chapter: number; verse: number }>> = {
  "43-3-16": [
    { book: 45, chapter: 5, verse: 8 },
    { book: 62, chapter: 4, verse: 9 },
    { book: 49, chapter: 2, verse: 4 },
    { book: 44, chapter: 4, verse: 12 },
  ],
  "19-23-1": [
    { book: 45, chapter: 8, verse: 28 },
    { book: 40, chapter: 6, verse: 25 },
    { book: 50, chapter: 4, verse: 19 },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  const verse = searchParams.get("verse");
  const translation = searchParams.get("translation") ?? "KJV";

  if (!book || !chapter || !verse) {
    return NextResponse.json({ refs: [] });
  }

  const key = `${book}-${chapter}-${verse}`;
  const refs = CROSS_REFS[key] ?? [];

  // Resolve verse text for each reference
  const resolved = await Promise.allSettled(
    refs.map(async (ref) => {
      const verses = await fetchChapter(translation, ref.book, ref.chapter);
      const verseData = verses.find((v) => v.verse === ref.verse);
      return {
        ...ref,
        text: verseData?.text ?? "",
        translation,
      };
    })
  );

  const results = resolved
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<typeof resolved[0] extends PromiseFulfilledResult<infer T> ? T : never>).value);

  return NextResponse.json({ refs: results });
}
