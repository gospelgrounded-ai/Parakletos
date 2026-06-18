import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await db.readingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      // Return default starting position if no progress saved
      return NextResponse.json({
        progress: {
          translation: "KJV",
          book: 43,
          chapter: 1,
          verse: 1,
        },
      });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[PROGRESS_GET]", error);
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
    const { translation, book, chapter, verse } = body;

    if (!translation || !book || !chapter) {
      return NextResponse.json(
        { error: "translation, book, and chapter are required" },
        { status: 400 }
      );
    }

    const bookNum = parseInt(String(book), 10);
    const chapterNum = parseInt(String(chapter), 10);
    const verseNum = verse !== undefined ? parseInt(String(verse), 10) : 1;

    if (isNaN(bookNum) || isNaN(chapterNum) || isNaN(verseNum)) {
      return NextResponse.json(
        { error: "book, chapter, and verse must be valid numbers" },
        { status: 400 }
      );
    }

    const progress = await db.readingProgress.upsert({
      where: { userId: session.user.id },
      update: {
        translation: translation.toUpperCase(),
        book: bookNum,
        chapter: chapterNum,
        verse: verseNum,
      },
      create: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book: bookNum,
        chapter: chapterNum,
        verse: verseNum,
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[PROGRESS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
