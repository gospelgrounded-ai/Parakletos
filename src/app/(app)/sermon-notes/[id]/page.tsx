import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import SermonNoteEditor from "@/components/sermon-notes/SermonNoteEditor";

export default async function SermonNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  let note = null;
  try {
    note = await db.sermonNote.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true, date: true, speaker: true, location: true, notes: true },
    });
  } catch {
    redirect("/sermon-notes");
  }

  if (!note) redirect("/sermon-notes");

  return <SermonNoteEditor note={note} />;
}
