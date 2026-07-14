import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { detectScriptureRefs } from "@/lib/detect-scriptures";
import ScriptureCard from "@/components/sermon-notes/ScriptureCard";
import { BookOpen, Calendar, MapPin, User } from "lucide-react";

// Tokenized private links — never index
export const metadata: Metadata = {
  title: "Shared Sermon Note",
  robots: { index: false, follow: false },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SharedSermonNotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length > 64) notFound();

  const note = await db.sermonNote
    .findUnique({
      where: { shareToken: token },
      select: {
        title: true,
        date: true,
        speaker: true,
        location: true,
        series: true,
        notes: true,
        translation: true,
        userId: true,
      },
    })
    .catch(() => null);
  if (!note) notFound();

  const ownerSettings = await db.userSettings
    .findUnique({
      where: { userId: note.userId },
      select: { defaultTranslation: true },
    })
    .catch(() => null);
  const translation =
    note.translation ?? ownerSettings?.defaultTranslation ?? "KJV";

  const refs = detectScriptureRefs(note.notes);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-serif font-bold">Parakletos</span>
          </Link>
          <span className="text-xs text-muted-foreground">Shared sermon note</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif">
            {note.title || "Untitled Sermon"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(note.date)}
            </span>
            {note.speaker && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {note.speaker}
              </span>
            )}
            {note.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {note.location}
              </span>
            )}
          </div>
          {note.series && (
            <p className="mt-2 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5 inline-block">
              {note.series}
            </p>
          )}
        </div>

        {refs.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Scriptures
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {refs.map((ref) => (
                <ScriptureCard key={ref.key} scripture={ref} translation={translation} />
              ))}
            </div>
          </section>
        )}

        {note.notes && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </h2>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.notes}</p>
            </div>
          </section>
        )}

        <p className="text-xs text-muted-foreground">
          The audio recording stays on the note-taker&apos;s device and isn&apos;t part
          of this page.
        </p>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          Shared from{" "}
          <Link href="/" className="text-primary font-medium hover:underline">
            Parakletos
          </Link>{" "}
          — a free Bible study app.
        </p>
      </footer>
    </div>
  );
}
