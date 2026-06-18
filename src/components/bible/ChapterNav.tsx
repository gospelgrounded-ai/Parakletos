"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBook, BIBLE_BOOKS } from "@/lib/bible-books";
import { cn } from "@/lib/utils";
import BookChapterSelector from "./BookChapterSelector";
import TranslationSelector from "./TranslationSelector";

interface ChapterNavProps {
  translation: string;
  book: number;
  chapter: number;
}

export default function ChapterNav({ translation, book, chapter }: ChapterNavProps) {
  const router = useRouter();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const bookInfo = getBook(book);
  const bookName = bookInfo?.name ?? "Bible";
  const totalChapters = bookInfo?.chapters ?? 1;

  const isFirstChapter = book === 1 && chapter === 1;
  const isLastChapter = book === 66 && chapter === totalChapters;

  function navigatePrev() {
    if (chapter > 1) {
      router.push(`/bible/${translation}/${book}/${chapter - 1}`);
    } else if (book > 1) {
      const prevBook = BIBLE_BOOKS[book - 2];
      router.push(`/bible/${translation}/${prevBook.id}/${prevBook.chapters}`);
    }
  }

  function navigateNext() {
    if (chapter < totalChapters) {
      router.push(`/bible/${translation}/${book}/${chapter + 1}`);
    } else if (book < 66) {
      const nextBook = BIBLE_BOOKS[book];
      router.push(`/bible/${translation}/${nextBook.id}/1`);
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        {/* Prev */}
        <Button
          variant="ghost"
          size="sm"
          onClick={navigatePrev}
          disabled={isFirstChapter}
          className={cn(
            "flex items-center gap-1 text-muted-foreground hover:text-foreground",
            "disabled:opacity-30"
          )}
          aria-label="Previous chapter"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Prev</span>
        </Button>

        {/* Center: Book + Chapter selector trigger */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectorOpen(true)}
            className="flex items-center gap-2 font-medium text-sm sm:text-base hover:bg-muted/60 px-3 rounded-lg"
          >
            <BookOpen className="h-4 w-4 text-primary/70 shrink-0" />
            <span className="truncate">
              {bookName} {chapter}
            </span>
          </Button>

          <TranslationSelector
            currentTranslation={translation}
            book={book}
            chapter={chapter}
          />
        </div>

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateNext}
          disabled={isLastChapter}
          className={cn(
            "flex items-center gap-1 text-muted-foreground hover:text-foreground",
            "disabled:opacity-30"
          )}
          aria-label="Next chapter"
        >
          <span className="hidden sm:inline text-sm">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>

      <BookChapterSelector
        translation={translation}
        currentBook={book}
        currentChapter={chapter}
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
      />
    </>
  );
}
