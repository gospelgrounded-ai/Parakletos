import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const verses = await db.memoryVerse.findMany({
    where: { userId: session.user.id },
    orderBy: { nextReview: "asc" },
  });
  return NextResponse.json(verses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { translation, book, chapter, verse } = body;

  if (!translation || !book || !chapter || !verse) {
    return NextResponse.json(
      { error: "translation, book, chapter, and verse are required" },
      { status: 400 }
    );
  }

  const entry = await db.memoryVerse.upsert({
    where: {
      userId_translation_book_chapter_verse: {
        userId: session.user.id,
        translation: String(translation).toUpperCase(),
        book: parseInt(String(book), 10),
        chapter: parseInt(String(chapter), 10),
        verse: parseInt(String(verse), 10),
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      translation: String(translation).toUpperCase(),
      book: parseInt(String(book), 10),
      chapter: parseInt(String(chapter), 10),
      verse: parseInt(String(verse), 10),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
