"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareVerseModal from "@/components/bible/ShareVerseModal";

interface VerseOfTheDayCardProps {
  book: number;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  translation: string;
}

export default function VerseOfTheDayCard({
  book,
  chapter,
  verse,
  reference,
  text,
  translation,
}: VerseOfTheDayCardProps) {
  const [showShare, setShowShare] = useState(false);

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Verse of the Day
      </h2>
      <div className="rounded-xl border bg-card p-5">
        <p className="font-serif text-lg leading-relaxed mb-3">&ldquo;{text}&rdquo;</p>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/bible/${translation}/${book}/${chapter}#v${verse}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {reference} — Read in context
          </Link>
          <Button
            onClick={() => setShowShare(true)}
            aria-label="Share verse"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showShare && (
        <ShareVerseModal
          verse={verse}
          text={text}
          translation={translation}
          book={book}
          chapter={chapter}
          onClose={() => setShowShare(false)}
        />
      )}
    </section>
  );
}
