"use client";

import { useState } from "react";
import { X, BookOpen, GitBranch, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatReference, getBook } from "@/lib/bible-books";
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

export default function StudyPanel({
  translation,
  book,
  chapter,
  verse,
  onClose,
}: StudyPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("cross-refs");

  const bookInfo = getBook(book);

  return (
    <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l bg-card h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <p className="font-semibold text-sm">Study Tools</p>
          {verse && (
            <p className="text-xs text-muted-foreground">
              {formatReference(book, chapter, verse)}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
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
      <div className="flex-1 overflow-y-auto">
        {activeTab === "cross-refs" && (
          <CrossRefsTab
            translation={translation}
            book={book}
            chapter={chapter}
            verse={verse}
          />
        )}
        {activeTab === "commentary" && (
          <CommentaryTab bookName={bookInfo?.name ?? ""} chapter={chapter} />
        )}
        {activeTab === "word-study" && (
          <WordStudyTab book={book} chapter={chapter} verse={verse} />
        )}
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

function CommentaryTab({
  bookName,
  chapter,
}: {
  bookName: string;
  chapter: number;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-8">
        <Scroll className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-medium text-sm">Commentary</p>
        <p className="text-xs text-muted-foreground mt-1">
          {bookName} {chapter}
        </p>
        <p className="text-xs text-muted-foreground mt-4 max-w-48 mx-auto">
          Matthew Henry&apos;s Commentary and other resources coming soon.
        </p>
      </div>

      {/* Placeholder cards */}
      <div className="space-y-3">
        {["Matthew Henry", "Adam Clarke", "John Gill"].map((name) => (
          <div key={name} className="border rounded-lg p-3 opacity-40">
            <p className="text-xs font-semibold mb-1">{name}&apos;s Commentary</p>
            <div className="space-y-1.5">
              <div className="h-2 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-4/5" />
              <div className="h-2 bg-muted rounded animate-pulse w-3/5" />
            </div>
          </div>
        ))}
      </div>
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
