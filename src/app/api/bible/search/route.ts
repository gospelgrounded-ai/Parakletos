import { NextResponse } from "next/server";
import { searchBible } from "@/lib/bible-api";
import { BIBLE_BOOKS } from "@/lib/bible-books";

const BOOK_NAME_MAP = new Map(BIBLE_BOOKS.map((b) => [b.id, b.name]));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const translation = searchParams.get("translation") ?? "KJV";

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const rawResults = await searchBible(translation.toUpperCase(), query.trim());

    const results = rawResults.slice(0, 50).map((result) => ({
      ...result,
      bookName: BOOK_NAME_MAP.get(result.book) ?? `Book ${result.book}`,
    }));

    return NextResponse.json({
      results,
      query: query.trim(),
      truncated: rawResults.length > 50,
    });
  } catch (error) {
    console.error("[BIBLE_SEARCH]", error);
    return NextResponse.json(
      { error: "Failed to search Bible" },
      { status: 500 }
    );
  }
}
