import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notes = await db.sermonNote.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, date: true, speaker: true, location: true, notes: true, updatedAt: true },
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { title = "Untitled Sermon", date, speaker = "", location = "", notes = "" } = body;
  const today = new Date().toISOString().slice(0, 10);
  const note = await db.sermonNote.create({
    data: { userId: session.user.id, title, date: date ?? today, speaker, location, notes },
  });
  return NextResponse.json(note, { status: 201 });
}
