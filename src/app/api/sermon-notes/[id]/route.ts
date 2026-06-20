import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { title, date, speaker, location, notes } = body;

  try {
    const note = await db.sermonNote.update({
      where: { id, userId: session.user.id },
      data: { title, date, speaker, location, notes },
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await db.sermonNote.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
