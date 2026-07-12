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
  const body = await request.json().catch(() => ({}));
  const { title, content, isAnswered } = body;

  const data: {
    title?: string;
    content?: string;
    isAnswered?: boolean;
    answeredAt?: Date | null;
  } = {};
  if (typeof title === "string") data.title = title;
  if (typeof content === "string") data.content = content;
  if (typeof isAnswered === "boolean") {
    data.isAnswered = isAnswered;
    data.answeredAt = isAnswered ? new Date() : null;
  }

  try {
    const entry = await db.prayerEntry.update({
      where: { id, userId: session.user.id },
      data,
    });
    return NextResponse.json(entry);
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
    await db.prayerEntry.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
