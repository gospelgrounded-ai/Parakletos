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

    if (searchParams.get("all") === "true") {
      const notes = await db.note.findMany({
        where: { userId: session.user.id },
        orderBy: [{ book: "asc" }, { chapter: "asc" }, { verse: "asc" }],
      });
      return NextResponse.json({ notes });
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

    const notes = await db.note.findMany({
      where: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book,
        chapter,
      },
      orderBy: { verse: "asc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[NOTES_GET]", error);
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
    const { translation, book, chapter, verse, content } = body;

    if (!translation || !book || !chapter || !verse || content === undefined) {
      return NextResponse.json(
        { error: "translation, book, chapter, verse, and content are required" },
        { status: 400 }
      );
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "content must be a string" },
        { status: 400 }
      );
    }

    const note = await db.note.upsert({
      where: {
        userId_translation_book_chapter_verse: {
          userId: session.user.id,
          translation: translation.toUpperCase(),
          book: parseInt(String(book), 10),
          chapter: parseInt(String(chapter), 10),
          verse: parseInt(String(verse), 10),
        },
      },
      update: { content },
      create: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book: parseInt(String(book), 10),
        chapter: parseInt(String(chapter), 10),
        verse: parseInt(String(verse), 10),
        content,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[NOTES_POST]", error);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Note id is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const note = await db.note.findUnique({ where: { id } });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    if (note.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.note.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTES_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
