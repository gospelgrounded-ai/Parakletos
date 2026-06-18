import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BIBLE_BOOKS } from "@/lib/bible-books";

const BOOK_NAME_MAP = new Map(BIBLE_BOOKS.map((b) => [b.id, b.name]));

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const bookmarksWithNames = bookmarks.map((bookmark) => ({
      ...bookmark,
      bookName: BOOK_NAME_MAP.get(bookmark.book) ?? `Book ${bookmark.book}`,
    }));

    return NextResponse.json({ bookmarks: bookmarksWithNames });
  } catch (error) {
    console.error("[BOOKMARKS_GET]", error);
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
    const { translation, book, chapter, verse, label } = body;

    if (!translation || !book || !chapter || !verse) {
      return NextResponse.json(
        { error: "translation, book, chapter, and verse are required" },
        { status: 400 }
      );
    }

    const bookmark = await db.bookmark.upsert({
      where: {
        userId_translation_book_chapter_verse: {
          userId: session.user.id,
          translation: translation.toUpperCase(),
          book: parseInt(String(book), 10),
          chapter: parseInt(String(chapter), 10),
          verse: parseInt(String(verse), 10),
        },
      },
      update: {
        label: label ?? null,
      },
      create: {
        userId: session.user.id,
        translation: translation.toUpperCase(),
        book: parseInt(String(book), 10),
        chapter: parseInt(String(chapter), 10),
        verse: parseInt(String(verse), 10),
        label: label ?? null,
      },
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error("[BOOKMARKS_POST]", error);
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
        { error: "Bookmark id is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const bookmark = await db.bookmark.findUnique({ where: { id } });
    if (!bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }
    if (bookmark.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.bookmark.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BOOKMARKS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
