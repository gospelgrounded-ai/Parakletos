import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const translation = searchParams.get("translation");
    const bookParam = searchParams.get("book");
    const chapterParam = searchParams.get("chapter");

    // Support ?all=true to return all user highlights (for library page)
    if (searchParams.get("all") === "true") {
      const highlights = await db.highlight.findMany({
        where: { userId: session.user.id },
        orderBy: [{ book: "asc" }, { chapter: "asc" }, { verse: "asc" }],
      });
      return NextResponse.json({ highlights });
    }

    if (!translation || !bookParam || !chapterParam) {
      return NextResponse.json(
        { error: "translation, book, and chapter are required" },
        { status: 400 }
      );
    }

    const book = parseInt(bookParam, 10);
    const chapter = parseInt(chapterParam, 10);

    if (isNaN(book) || isNaN(chapter)) {
      return NextResponse.json(
        { error: "book and chapter must be valid numbers" },
        { status: 400 }
      );
    }

    const highlights = await db.highlight.findMany({
      where: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book,
        chapter,
      },
      orderBy: { verse: "asc" },
    });

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error("[HIGHLIGHTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { translation, book, chapter, verse, color } = body;

    if (!translation || !book || !chapter || !verse || !color) {
      return NextResponse.json(
        { error: "translation, book, chapter, verse, and color are required" },
        { status: 400 }
      );
    }

    const validColors = ["yellow", "green", "blue", "pink", "purple"];
    if (!validColors.includes(color)) {
      return NextResponse.json(
        { error: `color must be one of: ${validColors.join(", ")}` },
        { status: 400 }
      );
    }

    const highlight = await db.highlight.upsert({
      where: {
        userId_translation_book_chapter_verse: {
          userId: session.user.id,
          translation: translation.toUpperCase(),
          book: parseInt(String(book), 10),
          chapter: parseInt(String(chapter), 10),
          verse: parseInt(String(verse), 10),
        },
      },
      update: { color },
      create: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book: parseInt(String(book), 10),
        chapter: parseInt(String(chapter), 10),
        verse: parseInt(String(verse), 10),
        color,
      },
    });

    return NextResponse.json({ highlight }, { status: 201 });
  } catch (error) {
    console.error("[HIGHLIGHTS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const translation = searchParams.get("translation");
    const bookParam = searchParams.get("book");
    const chapterParam = searchParams.get("chapter");
    const verseParam = searchParams.get("verse");

    if (!translation || !bookParam || !chapterParam || !verseParam) {
      return NextResponse.json(
        { error: "translation, book, chapter, and verse are required" },
        { status: 400 }
      );
    }

    const book = parseInt(bookParam, 10);
    const chapter = parseInt(chapterParam, 10);
    const verse = parseInt(verseParam, 10);

    if (isNaN(book) || isNaN(chapter) || isNaN(verse)) {
      return NextResponse.json(
        { error: "book, chapter, and verse must be valid numbers" },
        { status: 400 }
      );
    }

    await db.highlight.deleteMany({
      where: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book,
        chapter,
        verse,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[HIGHLIGHTS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
