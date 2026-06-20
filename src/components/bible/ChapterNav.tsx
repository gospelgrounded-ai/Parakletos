"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBook, BIBLE_BOOKS } from "@/lib/bible-books";
import { cn } from "@/lib/utils";
import BookChapterSelector from "./BookChapterSelector";
import TranslationSelector from "./TranslationSelector";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChapterNavProps {
  translation: string;
  book: number;
  chapter: number;
}

interface PlanPassage {
  book: number;
  chapter: number;
}

interface PlanDay {
  dayNumber: number;
  passages: string;
}

interface FlatPassage {
  day: number;
  passageIdx: number;
  book: number;
  chapter: number;
}

function flattenPlan(days: PlanDay[]): FlatPassage[] {
  const result: FlatPassage[] = [];
  for (const day of days) {
    const passages: PlanPassage[] = JSON.parse(day.passages);
    passages.forEach((p, i) =>
      result.push({ day: day.dayNumber, passageIdx: i, book: p.book, chapter: p.chapter })
    );
  }
  return result;
}

function ChapterNavInner({ translation, book, chapter }: ChapterNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const planId = searchParams.get("planId");
  const planDay = Number(searchParams.get("day") ?? "0");
  const passageIdx = Number(searchParams.get("passage") ?? "0");

  const { data: plan } = useSWR(
    planId ? `/api/reading-plans/${planId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const bookInfo = getBook(book);
  const bookName = bookInfo?.name ?? "Bible";
  const totalChapters = bookInfo?.chapters ?? 1;

  // Flatten plan into an ordered sequence of passages
  const flat: FlatPassage[] = plan?.days ? flattenPlan(plan.days as PlanDay[]) : [];
  const currentFlatIdx = planId
    ? flat.findIndex((p) => p.day === planDay && p.passageIdx === passageIdx)
    : -1;
  const inPlanMode = planId != null && currentFlatIdx >= 0;

  const prevEntry = inPlanMode ? (flat[currentFlatIdx - 1] ?? null) : null;
  const nextEntry = inPlanMode ? (flat[currentFlatIdx + 1] ?? null) : null;

  // Passages in the current plan day (to show "X of Y" counter)
  const dayPassages = flat.filter((p) => p.day === planDay);

  function planUrl(entry: FlatPassage) {
    return `/bible/${translation}/${entry.book}/${entry.chapter}?planId=${planId}&day=${entry.day}&passage=${entry.passageIdx}`;
  }

  function markDayComplete() {
    fetch(`/api/reading-plans/${planId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayNumber: planDay }),
    }).catch(() => {});
  }

  function navigatePrev() {
    if (inPlanMode) {
      if (prevEntry) router.push(planUrl(prevEntry));
    } else {
      if (chapter > 1) {
        router.push(`/bible/${translation}/${book}/${chapter - 1}`);
      } else if (book > 1) {
        const prevBook = BIBLE_BOOKS[book - 2];
        router.push(`/bible/${translation}/${prevBook.id}/${prevBook.chapters}`);
      }
    }
  }

  function navigateNext() {
    if (inPlanMode) {
      if (nextEntry) {
        // Crossing into a new day — mark the current day complete
        if (nextEntry.day > planDay) markDayComplete();
        router.push(planUrl(nextEntry));
      } else {
        // Last passage of the entire plan — mark complete, return to plan page
        markDayComplete();
        router.push(`/plans/${planId}`);
      }
    } else {
      if (chapter < totalChapters) {
        router.push(`/bible/${translation}/${book}/${chapter + 1}`);
      } else if (book < 66) {
        const nextBook = BIBLE_BOOKS[book];
        router.push(`/bible/${translation}/${nextBook.id}/1`);
      }
    }
  }

  const prevDisabled = inPlanMode ? !prevEntry : book === 1 && chapter === 1;
  const nextDisabled = !inPlanMode && book === 66 && chapter === totalChapters;

  // Plan-aware Prev label: show the reference or "Day N" when crossing days
  function prevLabel() {
    if (inPlanMode && prevEntry) {
      if (prevEntry.day < planDay) {
        return `Day ${prevEntry.day}`;
      }
      const b = getBook(prevEntry.book);
      return `${b?.shortName ?? ""} ${prevEntry.chapter}`;
    }
    return "Prev";
  }

  // Plan-aware Next label
  function nextLabel() {
    if (inPlanMode) {
      if (!nextEntry) return "Done";
      if (nextEntry.day > planDay) return `Day ${nextEntry.day}`;
      const b = getBook(nextEntry.book);
      return `${b?.shortName ?? ""} ${nextEntry.chapter}`;
    }
    return "Next";
  }

  // Preserve plan params when translation changes
  const planSearch = planId
    ? `planId=${planId}&day=${planDay}&passage=${passageIdx}`
    : undefined;

  return (
    // Single sticky wrapper so the plan banner stays fixed with the nav
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
      {/* Plan context banner */}
      {inPlanMode && (
        <div className="flex items-center justify-center gap-1.5 px-4 py-1 bg-primary/5 border-b text-xs text-primary">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="font-medium truncate max-w-[140px]">{plan?.title}</span>
          <span className="text-primary/50">·</span>
          <span className="shrink-0">Day {planDay}</span>
          {dayPassages.length > 1 && (
            <>
              <span className="text-primary/50">·</span>
              <span className="shrink-0">
                {passageIdx + 1} of {dayPassages.length}
              </span>
            </>
          )}
        </div>
      )}

      <nav className="flex items-center justify-between gap-2 px-4 py-2">
        {/* Prev */}
        <Button
          variant="ghost"
          size="sm"
          onClick={navigatePrev}
          disabled={prevDisabled}
          className={cn(
            "flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          )}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{prevLabel()}</span>
        </Button>

        {/* Center */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectorOpen(true)}
            className="flex items-center gap-2 font-medium text-sm sm:text-base hover:bg-muted/60 px-3 rounded-lg"
          >
            <BookOpen className="h-4 w-4 text-primary/70 shrink-0" />
            <span className="truncate">{bookName} {chapter}</span>
          </Button>

          <TranslationSelector
            currentTranslation={translation}
            book={book}
            chapter={chapter}
            extraSearch={planSearch}
          />
        </div>

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateNext}
          disabled={nextDisabled}
          className={cn(
            "flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          )}
          aria-label="Next"
        >
          <span className="hidden sm:inline text-sm">{nextLabel()}</span>
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
    </div>
  );
}

function ChapterNavSkeleton({ translation, book, chapter }: ChapterNavProps) {
  const bookInfo = getBook(book);
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
      <nav className="flex items-center justify-between gap-2 px-4 py-2">
        <Button variant="ghost" size="sm" disabled className="opacity-30">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Prev</span>
        </Button>
        <Button variant="ghost" size="sm" className="font-medium text-sm sm:text-base px-3">
          <BookOpen className="h-4 w-4 text-primary/70 shrink-0 mr-2" />
          {bookInfo?.name ?? "Bible"} {chapter}
        </Button>
        <Button variant="ghost" size="sm" disabled className="opacity-30">
          <span className="hidden sm:inline text-sm">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}

export default function ChapterNav(props: ChapterNavProps) {
  return (
    <Suspense fallback={<ChapterNavSkeleton {...props} />}>
      <ChapterNavInner {...props} />
    </Suspense>
  );
}
