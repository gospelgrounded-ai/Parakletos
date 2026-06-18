import { NextResponse } from "next/server";
import { fetchChapter } from "@/lib/bible-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ translation: string; book: string; chapter: string }> }
) {
  try {
    const { translation, book: bookParam, chapter: chapterParam } = await params;

    const book = parseInt(bookParam, 10);
    const chapter = parseInt(chapterParam, 10);

    if (isNaN(book) || book < 1 || book > 66) {
      return NextResponse.json(
        { error: "Invalid book number" },
        { status: 400 }
      );
    }

    if (isNaN(chapter) || chapter < 1) {
      return NextResponse.json(
        { error: "Invalid chapter number" },
        { status: 400 }
      );
    }

    if (!translation || translation.length > 10) {
      return NextResponse.json(
        { error: "Invalid translation" },
        { status: 400 }
      );
    }

    const verses = await fetchChapter(translation.toUpperCase(), book, chapter);

    return NextResponse.json(
      { verses, translation: translation.toUpperCase(), book, chapter },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("[BIBLE_CHAPTER]", error);
    return NextResponse.json(
      { error: "Failed to fetch Bible chapter" },
      { status: 500 }
    );
  }
}
