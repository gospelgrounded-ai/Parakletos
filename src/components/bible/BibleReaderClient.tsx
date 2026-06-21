"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { type HighlightColor } from "@/types";
import { getBook } from "@/lib/bible-books";
import { useReaderSettings } from "@/hooks/useReaderSettings";
import ChapterNav from "./ChapterNav";
import VerseList from "./VerseList";
import ParallelVerseList from "./ParallelVerseList";
import InterlinearVerseList from "./InterlinearVerseList";
import AudioPlayer from "./AudioPlayer";
import VerseActionsBar from "./VerseActionsBar";
import StudyPanel from "./StudyPanel";

interface BibleReaderClientProps {
  verses: Array<{ pk: number; verse: number; text: string }>;
  translation: string;
  book: number;
  chapter: number;
  initialHighlights: Array<{ id: string; verse: number; color: string }>;
  initialBookmarks: Array<{ id: string; verse: number; label?: string | null }>;
  initialNotes: Array<{ id: string; verse: number; content: string }>;
  parallelTranslation?: string;
  interlinearMode?: boolean;
  isAuthenticated?: boolean;
}

export default function BibleReaderClient({
  verses,
  translation,
  book,
  chapter,
  initialHighlights,
  initialBookmarks,
  initialNotes,
  parallelTranslation,
  interlinearMode,
  isAuthenticated = true,
}: BibleReaderClientProps) {
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [highlights, setHighlights] = useState<Map<number, { id: string; color: string }>>(
    () => new Map(initialHighlights.map((h) => [h.verse, { id: h.id, color: h.color }]))
  );
  const [bookmarks, setBookmarks] = useState<Set<number>>(
    () => new Set(initialBookmarks.map((b) => b.verse))
  );
  const [bookmarkData, setBookmarkData] = useState<Map<number, { id: string; label?: string | null }>>(
    () => new Map(initialBookmarks.map((b) => [b.verse, { id: b.id, label: b.label }]))
  );
  const [notes, setNotes] = useState<Map<number, { id: string; content: string }>>(
    () => new Map(initialNotes.map((n) => [n.verse, { id: n.id, content: n.content }]))
  );
  const [studyPanelOpen, setStudyPanelOpen] = useState(false);
  const [activeStudyVerse, setActiveStudyVerse] = useState<number | null>(null);
  const [audioMode, setAudioMode] = useState(false);
  const [readingVerse, setReadingVerse] = useState<number | null>(null);
  const {
    settings,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    canIncrease,
    canDecrease,
  } = useReaderSettings();

  const bookName = getBook(book)?.name ?? "Bible";

  // Scroll to (and briefly flash) a verse when arriving via a #v{n} deep-link,
  // e.g. from the Library or a cross-reference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#v")) return;
    const target = Number(hash.slice(2));
    if (!target) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`v${target}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("verse-flash");
      setTimeout(() => el.classList.remove("verse-flash"), 2200);
    }, 150);
    return () => clearTimeout(timer);
  }, [translation, book, chapter]);

  // Save reading progress on mount
  const progressSaved = useRef(false);
  useEffect(() => {
    if (progressSaved.current) return;
    progressSaved.current = true;
    fetch("/api/user/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation, book, chapter, verse: 1 }),
    }).catch(() => {
      // silently fail — user may not be logged in
    });
  }, [translation, book, chapter]);

  const selectedVerseText = selectedVerse
    ? verses.find((v) => v.verse === selectedVerse)?.text ?? ""
    : "";

  async function handleHighlight(color: HighlightColor | null) {
    if (!selectedVerse) return;
    const existing = highlights.get(selectedVerse);

    if (color === null || (existing && existing.color === color)) {
      // Remove highlight
      if (!existing) return;
      try {
        const params = new URLSearchParams({
          translation,
          book: String(book),
          chapter: String(chapter),
          verse: String(selectedVerse),
        });
        const res = await fetch(`/api/user/highlights?${params}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setHighlights((prev) => {
          const next = new Map(prev);
          next.delete(selectedVerse);
          return next;
        });
      } catch {
        toast.error("Failed to remove highlight");
      }
    } else {
      // Add or update highlight
      try {
        const res = await fetch("/api/user/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translation, book, chapter, verse: selectedVerse, color }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHighlights((prev) => {
          const next = new Map(prev);
          next.set(selectedVerse, { id: data.highlight.id, color });
          return next;
        });
      } catch {
        toast.error("Failed to save highlight");
      }
    }
  }

  async function handleBookmark() {
    if (!selectedVerse) return;
    const isBookmarked = bookmarks.has(selectedVerse);

    if (isBookmarked) {
      const bm = bookmarkData.get(selectedVerse);
      if (!bm) return;
      try {
        const res = await fetch(`/api/user/bookmarks?id=${bm.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setBookmarks((prev) => {
          const next = new Set(prev);
          next.delete(selectedVerse);
          return next;
        });
        setBookmarkData((prev) => {
          const next = new Map(prev);
          next.delete(selectedVerse);
          return next;
        });
      } catch {
        toast.error("Failed to remove bookmark");
      }
    } else {
      try {
        const res = await fetch("/api/user/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translation, book, chapter, verse: selectedVerse }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBookmarks((prev) => new Set(prev).add(selectedVerse));
        setBookmarkData((prev) => {
          const next = new Map(prev);
          next.set(selectedVerse, { id: data.bookmark.id, label: data.bookmark.label });
          return next;
        });
        toast.success("Verse bookmarked");
      } catch {
        toast.error("Failed to save bookmark");
      }
    }
  }

  async function handleNote(content: string) {
    if (!selectedVerse) return;
    try {
      const res = await fetch("/api/user/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translation, book, chapter, verse: selectedVerse, content }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes((prev) => {
        const next = new Map(prev);
        next.set(selectedVerse, { id: data.note.id, content });
        return next;
      });
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Reader area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <ChapterNav
          translation={translation}
          book={book}
          chapter={chapter}
          audioActive={audioMode}
          onAudioToggle={() => setAudioMode((v) => !v)}
          readerSettings={settings}
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
          canIncreaseFontSize={canIncrease}
          canDecreaseFontSize={canDecrease}
          onFontFamily={setFontFamily}
        />
        <div
          className="flex-1 overflow-y-auto"
          style={{
            background: "hsl(var(--reader-bg))",
            "--reader-font-family":
              settings.fontFamily === "sans"
                ? "system-ui, -apple-system, sans-serif"
                : "Georgia, 'Times New Roman', serif",
            "--reader-font-size": `${(settings.fontSize / 100) * 1.25}rem`,
          } as React.CSSProperties}
        >
          <div
            className={
              parallelTranslation
                ? `max-w-5xl mx-auto px-4 sm:px-6 py-8 ${audioMode ? "pb-44" : "pb-28"}`
                : interlinearMode
                ? `max-w-3xl mx-auto px-4 sm:px-6 py-8 ${audioMode ? "pb-44" : "pb-28"}`
                : `max-w-2xl mx-auto px-4 sm:px-8 py-8 ${audioMode ? "pb-44" : "pb-28"}`
            }
          >
            {interlinearMode ? (
              <InterlinearVerseList
                book={book}
                chapter={chapter}
                selectedVerse={selectedVerse}
                onVerseClick={(verse) =>
                  setSelectedVerse(verse === selectedVerse ? null : verse)
                }
              />
            ) : parallelTranslation ? (
              <ParallelVerseList
                verses={verses}
                translation={translation}
                parallelTranslation={parallelTranslation}
                book={book}
                chapter={chapter}
                highlights={highlights}
                bookmarks={bookmarks}
                notes={notes}
                selectedVerse={selectedVerse}
                onVerseClick={(verse) =>
                  setSelectedVerse(verse === selectedVerse ? null : verse)
                }
              />
            ) : (
              <VerseList
                verses={verses}
                translation={translation}
                book={book}
                chapter={chapter}
                highlights={highlights}
                bookmarks={bookmarks}
                notes={notes}
                selectedVerse={selectedVerse}
                readingVerse={readingVerse}
                onVerseClick={(verse) =>
                  setSelectedVerse(verse === selectedVerse ? null : verse)
                }
              />
            )}

            {/* End-of-chapter CTA for unauthenticated readers */}
            {!isAuthenticated && (
              <div className="mt-12 mb-4 rounded-2xl border bg-card p-6 text-center shadow-sm">
                <p className="text-lg font-serif font-semibold mb-1">
                  Enjoyed reading {bookName} {chapter}?
                </p>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                  Create a free account to highlight verses, take notes, and
                  pick up where you left off — across all your devices.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/register"
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Create free account
                  </Link>
                  <Link
                    href="/login"
                    className="border px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Study Panel — desktop sidebar */}
      {studyPanelOpen && (
        <StudyPanel
          translation={translation}
          book={book}
          chapter={chapter}
          verse={activeStudyVerse}
          onClose={() => setStudyPanelOpen(false)}
        />
      )}

      {/* Audio Player — fixed bottom bar */}
      {audioMode && (
        <AudioPlayer
          verses={verses}
          bookName={bookName}
          chapter={chapter}
          isAuthenticated={isAuthenticated}
          onReadingVerseChange={setReadingVerse}
          onClose={() => {
            setAudioMode(false);
            setReadingVerse(null);
          }}
        />
      )}

      {/* Verse Actions Bar — fixed bottom bar */}
      {selectedVerse && (
        <VerseActionsBar
          verse={selectedVerse}
          text={selectedVerseText}
          translation={translation}
          book={book}
          chapter={chapter}
          currentHighlight={highlights.get(selectedVerse)?.color ?? null}
          isBookmarked={bookmarks.has(selectedVerse)}
          hasNote={notes.has(selectedVerse)}
          note={notes.get(selectedVerse)}
          onHighlight={handleHighlight}
          onBookmark={handleBookmark}
          onNote={handleNote}
          onStudy={() => {
            setActiveStudyVerse(selectedVerse);
            setStudyPanelOpen(true);
          }}
          onClose={() => setSelectedVerse(null)}
        />
      )}
    </div>
  );
}
