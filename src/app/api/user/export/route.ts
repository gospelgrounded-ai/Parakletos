import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [
    user,
    highlights,
    bookmarks,
    notes,
    sermonNotes,
    readingProgress,
    settings,
    planEnrollments,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    db.highlight.findMany({ where: { userId } }),
    db.bookmark.findMany({ where: { userId } }),
    db.note.findMany({ where: { userId } }),
    db.sermonNote.findMany({ where: { userId } }),
    db.readingProgress.findUnique({ where: { userId } }),
    db.userSettings.findUnique({ where: { userId } }),
    db.planEnrollment.findMany({
      where: { userId },
      include: { plan: { select: { slug: true, title: true } } },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: user,
    highlights,
    bookmarks,
    notes,
    sermonNotes,
    readingProgress,
    settings,
    planEnrollments,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="parakletos-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
