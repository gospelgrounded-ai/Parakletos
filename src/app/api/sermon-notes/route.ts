import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sermonNoteCreateSchema } from "@/lib/validations/sermon-note";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const notes = await db.sermonNote.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, date: true, speaker: true, location: true, notes: true, updatedAt: true },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("[SERMON_NOTES_GET]", error);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`sermon-create:${session.user.id}`, 30);
  if (!allowed) {
    return NextResponse.json({ error: "Too many new notes — try again later" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = sermonNoteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note data" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const note = await db.sermonNote.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      date: parsed.data.date ?? today,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
