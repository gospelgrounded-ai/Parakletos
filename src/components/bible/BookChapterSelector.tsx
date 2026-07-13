"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BIBLE_BOOKS, BibleBook } from "@/lib/bible-books";
import TranslationSelector from "./TranslationSelector";

interface BookChapterSelectorProps {
  translation: string;
  currentBook: number;
  currentChapter: number;
  isOpen: boolean;
  onClose: () => void;
  extraSearch?: string;
}

export default function BookChapterSelector({
  translation,
  currentBook,
  currentChapter,
  isOpen,
  onClose,
  extraSearch,
}: BookChapterSelectorProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"books" | "chapters">("books");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return BIBLE_BOOKS;
    const q = searchQuery.toLowerCase();
    return BIBLE_BOOKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const otFiltered = filteredBooks.filter((b) => b.testament === "OT");
  const ntFiltered = filteredBooks.filter((b) => b.testament === "NT");

  function handleBookSelect(book: BibleBook) {
    setSelectedBook(book);
    setView("chapters");
  }

  function handleChapterSelect(chapterNum: number) {
    if (!selectedBook) return;
    router.push(`/bible/${translation}/${selectedBook.id}/${chapterNum}`);
    onClose();
    // Reset after close
    setTimeout(() => {
      setView("books");
      setSearchQuery("");
      setSelectedBook(null);
    }, 300);
  }

  function handleBack() {
    setView("books");
    setSelectedBook(null);
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <div className="flex items-center gap-2">
            {view === "chapters" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8 shrink-0"
                aria-label="Back to books"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className="text-base font-semibold">
              {view === "books" ? "Choose a Book" : selectedBook?.name}
            </SheetTitle>
          </div>

          {view === "books" && (
            <>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search books…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                  autoFocus
                />
              </div>

              {/* On phones the top bar has no translation control — offer it here */}
              <div className="sm:hidden mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Translation</span>
                <TranslationSelector
                  currentTranslation={translation}
                  book={currentBook}
                  chapter={currentChapter}
                  extraSearch={extraSearch}
                />
              </div>
            </>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          {view === "books" && (
            <div className="px-2 py-3 space-y-4">
              {/* Old Testament */}
              {otFiltered.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">
                    Old Testament
                  </h3>
                  <div className="space-y-0.5">
                    {otFiltered.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleBookSelect(b)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                          "hover:bg-muted/60 text-left",
                          b.id === currentBook && "bg-primary/10 font-medium text-primary"
                        )}
                      >
                        <span>{b.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {b.chapters} ch
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* New Testament */}
              {ntFiltered.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">
                    New Testament
                  </h3>
                  <div className="space-y-0.5">
                    {ntFiltered.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleBookSelect(b)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                          "hover:bg-muted/60 text-left",
                          b.id === currentBook && "bg-primary/10 font-medium text-primary"
                        )}
                      >
                        <span>{b.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {b.chapters} ch
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {filteredBooks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">No books found for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {view === "chapters" && selectedBook && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-4">
                {selectedBook.testament === "OT" ? "Old" : "New"} Testament ·{" "}
                {selectedBook.chapters} chapters
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(
                  (num) => {
                    const isCurrent =
                      selectedBook.id === currentBook && num === currentChapter;
                    return (
                      <button
                        key={num}
                        onClick={() => handleChapterSelect(num)}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                          "hover:bg-primary hover:text-primary-foreground",
                          isCurrent
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-foreground"
                        )}
                      >
                        {num}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
