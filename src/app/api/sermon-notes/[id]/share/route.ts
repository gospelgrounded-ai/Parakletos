import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

/** Enable sharing: mint (or return the existing) share token. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const allowed = await checkRateLimit(`sermon-share:${session.user.id}`, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too many share requests" }, { status: 429 });
  }

  const note = await db.sermonNote.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, shareToken: true },
  });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (note.shareToken) {
    return NextResponse.json({ token: note.shareToken });
  }

  const token = crypto.randomBytes(24).toString("base64url");
  await db.sermonNote.update({
    where: { id: note.id },
    data: { shareToken: token },
  });
  return NextResponse.json({ token });
}

/** Stop sharing: revoke the token (the old link 404s from then on). */
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
    await db.sermonNote.update({
      where: { id, userId: session.user.id },
      data: { shareToken: null },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
