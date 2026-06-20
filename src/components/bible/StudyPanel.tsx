"use client";

import { useEffect, useRef, useState } from "react";
import { X, BookOpen, GitBranch, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatReference } from "@/lib/bible-books";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StudyPanelProps {
  translation: string;
  book: number;
  chapter: number;
  verse: number | null;
  onClose: () => void;
}

type Tab = "cross-refs" | "commentary" | "word-study";

export default function StudyPanel(props: StudyPanelProps) {
  return (
    <>
      {/* Desktop: docked sidebar */}
      <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l bg-card h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-semibold text-sm">Study Tools</p>
            {props.verse && (
              <p className="text-xs text-muted-foreground">
                {formatReference(props.book, props.chapter, props.verse)}
              </p>
            )}
          </div>
          <button
            onClick={props.onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <StudyTools {...props} />
      </div>

      {/* Mobile / tablet: bottom sheet */}
      <MobileStudySheet {...props} />
    </>
  );
}

/**
 * Shared tab bar + content, used by both the desktop sidebar and the mobile
 * bottom sheet. Each instance keeps its own tab state; SWR dedupes the fetches
 * by key so the two shells share one cache.
 */
function StudyTools({
  translation,
  book,
  chapter,
  verse,
}: Omit<StudyPanelProps, "onClose">) {
  const [activeTab, setActiveTab] = useState<Tab>("cross-refs");

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b shrink-0">
        {(
          [
            { id: "cross-refs" as Tab, label: "Cross-Refs", icon: <GitBranch className="h-3.5 w-3.5" /> },
            { id: "commentary" as Tab, label: "Commentary", icon: <Scroll className="h-3.5 w-3.5" /> },
            { id: "word-study" as Tab, label: "Word Study", icon: <BookOpen className="h-3.5 w-3.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === "cross-refs" && (
          <CrossRefsTab translation={translation} book={book} chapter={chapter} verse={verse} />
        )}
        {activeTab === "commentary" && (
          <CommentaryTab book={book} chapter={chapter} verse={verse} />
        )}
        {activeTab === "word-study" && (
          <WordStudyTab book={book} chapter={chapter} verse={verse} />
        )}
      </div>
    </>
  );
}

/**
 * Mobile bottom sheet: slides up from the bottom, dim backdrop, drag-handle
 * with swipe-to-dismiss. Hidden at lg+ where the docked sidebar takes over.
 */
function MobileStudySheet({
  translation,
  book,
  chapter,
  verse,
  onClose,
}: StudyPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  // Slide up on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Lock body scroll while the sheet is open — but only below lg, since this
  // component is also mounted (display:none) on desktop where the sidebar wins.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function close() {
    setMounted(false);
    setTimeout(onClose, 250); // let the slide-down finish
  }

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    const dy = e.touches[0].clientY - startY.current;
    setDragY(Math.max(0, dy));
  }
  function onTouchEnd() {
    setDragging(false);
    if (dragY > 110) {
      close();
    } else {
      setDragY(0);
    }
  }

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={close}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col bg-card rounded-t-2xl shadow-2xl max-h-[85vh] h-[85vh]"
        style={{
          transform: mounted ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging ? "none" : "transform 250ms ease-out",
        }}
      >
        {/* Drag handle */}
        <div
          className="shrink-0 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2.5 border-b shrink-0">
          <div>
            <p className="font-semibold text-sm">Study Tools</p>
            {verse && (
              <p className="text-xs text-muted-foreground">
                {formatReference(book, chapter, verse)}
              </p>
            )}
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <StudyTools translation={translation} book={book} chapter={chapter} verse={verse} />
      </div>
    </div>
  );
}

function CrossRefsTab({
  translation,
  book,
  chapter,
  verse,
}: {
  translation: string;
  book: number;
  chapter: number;
  verse: number | null;
}) {
  const { data, isLoading } = useSWR(
    verse
      ? `/api/cross-references?book=${book}&chapter=${chapter}&verse=${verse}&translation=${translation}`
      : null,
    fetcher
  );

  if (!verse) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>Select a verse to see cross-references</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const refs = data?.refs ?? [];

  if (refs.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No cross-references found for this verse</p>
        <p className="text-xs mt-1">More references coming soon</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {refs.map(
        (
          ref: {
            book: number;
            chapter: number;
            verse: number;
            reference: string;
            text: string;
          },
          i: number
        ) => (
          <Link
            key={i}
            href={`/bible/${translation}/${ref.book}/${ref.chapter}#v${ref.verse}`}
            className="block px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <p className="text-xs font-semibold text-primary mb-1">{ref.reference}</p>
            <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-3">
              {ref.text}
            </p>
          </Link>
        )
      )}
    </div>
  );
}

interface CommentaryVerse {
  verse: number;
  text: string;
}

interface CommentaryEntry {
  id: string;
  name: string;
  introduction: string | null;
  verses: CommentaryVerse[];
}

// Sentinel meaning "user explicitly closed all"
const COMMENTARY_NONE = "__none__";

function CommentaryTab({
  book,
  chapter,
  verse,
}: {
  book: number;
  chapter: number;
  verse: number | null;
}) {
  // null = default (first open), "__none__" = all closed, id = that one open
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useSWR(
    `/api/commentary?book=${book}&chapter=${chapter}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="h-3 bg-muted rounded w-36 animate-pulse" />
            <div className="space-y-1.5 mt-2">
              <div className="h-2 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-4/5" />
              <div className="h-2 bg-muted rounded animate-pulse w-3/5" />
              <div className="h-2 bg-muted rounded animate-pulse w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const commentaries: CommentaryEntry[] = data?.commentaries ?? [];

  if (commentaries.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Scroll className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No commentary available for this chapter</p>
        <p className="text-xs mt-1">More resources coming soon</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {commentaries.map((commentary) => {
        // Default: first commentary open; user can toggle
        const activeId = expanded === null ? (commentaries[0]?.id ?? "") : expanded;
        const isOpen = activeId !== COMMENTARY_NONE && activeId === commentary.id;
        return (
          <div key={commentary.id}>
            <button
              onClick={() => setExpanded(isOpen ? COMMENTARY_NONE : commentary.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <p className="text-xs font-semibold">{commentary.name}</p>
                <p className="text-[10px] text-muted-foreground">Public domain</p>
              </div>
              <span className="text-muted-foreground text-[10px]">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="pb-2">
                {commentary.introduction && (
                  <div className="px-4 py-2 border-b bg-muted/20">
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-serif italic">
                      {commentary.introduction}
                    </p>
                  </div>
                )}

                <div className="divide-y">
                  {commentary.verses.map((v) => (
                    <div
                      key={v.verse}
                      className={cn(
                        "px-4 py-2.5",
                        verse === v.verse && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <p className="text-[10px] font-semibold text-primary mb-1">v.{v.verse}</p>
                      <p className="text-xs text-foreground/80 leading-relaxed font-serif">
                        {v.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface StrongsWord {
  word: string;
  strongs: string;
  lemma: string | null;
  translit: string | null;
  pron: string | null;
  definition: string | null;
  kjvDef: string | null;
  derivation: string | null;
}

function WordStudyTab({
  book,
  chapter,
  verse,
}: {
  book: number;
  chapter: number;
  verse: number | null;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data, isLoading } = useSWR(
    verse ? `/api/word-study?book=${book}&chapter=${chapter}&verse=${verse}` : null,
    fetcher
  );

  if (!verse) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>Select a verse to study the original language</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const words: StrongsWord[] = data?.words ?? [];
  const language: string = data?.language ?? "original";

  if (words.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No original-language data available for this verse</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-2 border-b bg-muted/30">
        <p className="text-[11px] text-muted-foreground">
          {language} word study · Strong&apos;s numbers via KJV
        </p>
      </div>
      <div className="divide-y">
        {words.map((w, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-sm font-serif">{w.word || "—"}</span>
                  {w.lemma && (
                    <span className="ml-2 text-sm text-primary font-medium">{w.lemma}</span>
                  )}
                  {w.translit && (
                    <span className="ml-1.5 text-xs text-muted-foreground italic">
                      {w.translit}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {w.strongs}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 pt-0 space-y-2 text-xs">
                  {w.pron && (
                    <p className="text-muted-foreground">
                      Pronunciation: <span className="italic">{w.pron}</span>
                    </p>
                  )}
                  {w.definition && (
                    <p>
                      <span className="font-semibold">Definition: </span>
                      {w.definition}
                    </p>
                  )}
                  {w.kjvDef && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">KJV renderings: </span>
                      {w.kjvDef}
                    </p>
                  )}
                  {w.derivation && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Origin: </span>
                      {w.derivation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
