import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { advanceBox } from "@/lib/memory";

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
  if (typeof body.gotIt !== "boolean") {
    return NextResponse.json({ error: "gotIt (boolean) is required" }, { status: 400 });
  }

  try {
    const existing = await db.memoryVerse.findFirst({
      where: { id, userId: session.user.id },
      select: { box: true },
    });
    if (!existing) throw new Error("not found");

    const { box, nextReview } = advanceBox(existing.box, body.gotIt);
    const updated = await db.memoryVerse.update({
      where: { id, userId: session.user.id },
      data: { box, nextReview },
    });
    return NextResponse.json(updated);
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
    await db.memoryVerse.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
