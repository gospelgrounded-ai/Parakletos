"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, BookOpen, Calendar, Columns2, Languages, Volume2 } from "lucide-react";
import ReaderSettingsButton from "./ReaderSettingsButton";
import { type FontFamily, type ReaderSettings } from "@/hooks/useReaderSettings";
import { Button } from "@/components/ui/button";
import { getBook, BIBLE_BOOKS } from "@/lib/bible-books";
import { cn } from "@/lib/utils";
import BookChapterSelector from "./BookChapterSelector";
import TranslationSelector from "./TranslationSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/hooks/useTranslations";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChapterNavProps {
  translation: string;
  book: number;
  chapter: number;
  audioActive?: boolean;
  onAudioToggle?: () => void;
  readerSettings?: ReaderSettings;
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
  canIncreaseFontSize?: boolean;
  canDecreaseFontSize?: boolean;
  onFontFamily?: (f: FontFamily) => void;
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

function ChapterNavInner({
  translation,
  book,
  chapter,
  audioActive,
  onAudioToggle,
  readerSettings,
  onIncreaseFontSize,
  onDecreaseFontSize,
  canIncreaseFontSize,
  canDecreaseFontSize,
  onFontFamily,
}: ChapterNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const { english: availableTranslations } = useTranslations();

  const planId = searchParams.get("planId");
  const planDay = Number(searchParams.get("day") ?? "0");
  const passageIdx = Number(searchParams.get("passage") ?? "0");
  const parallelTranslation = searchParams.get("parallel");
  const interlinearMode = searchParams.get("interlinear") === "1";

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
    const base = `/bible/${translation}/${entry.book}/${entry.chapter}?planId=${planId}&day=${entry.day}&passage=${entry.passageIdx}`;
    if (parallelTranslation) return `${base}&parallel=${parallelTranslation}`;
    if (interlinearMode) return `${base}&interlinear=1`;
    return base;
  }

  function markDayComplete() {
    fetch(`/api/reading-plans/${planId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayNumber: planDay }),
    }).catch(() => {});
  }

  function toggleParallel() {
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("parallel")) {
      params.delete("parallel");
    } else {
      params.set("parallel", "NKJV");
    }
    const qs = params.toString();
    router.push(`/bible/${translation}/${book}/${chapter}${qs ? `?${qs}` : ""}`);
  }

  function changeParallel(newTranslation: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("parallel", newTranslation);
    router.push(`/bible/${translation}/${book}/${chapter}?${params.toString()}`);
  }

  function toggleInterlinear() {
    const params = new URLSearchParams(searchParams.toString());
    if (interlinearMode) {
      params.delete("interlinear");
    } else {
      params.set("interlinear", "1");
      params.delete("parallel"); // mutually exclusive
    }
    const qs = params.toString();
    router.push(`/bible/${translation}/${book}/${chapter}${qs ? `?${qs}` : ""}`);
  }

  function navigatePrev() {
    const qs = parallelTranslation
      ? `?parallel=${parallelTranslation}`
      : interlinearMode
      ? "?interlinear=1"
      : "";
    if (inPlanMode) {
      if (prevEntry) router.push(planUrl(prevEntry));
    } else {
      if (chapter > 1) {
        router.push(`/bible/${translation}/${book}/${chapter - 1}${qs}`);
      } else if (book > 1) {
        const prevBook = BIBLE_BOOKS[book - 2];
        router.push(`/bible/${translation}/${prevBook.id}/${prevBook.chapters}${qs}`);
      }
    }
  }

  function navigateNext() {
    const qs = parallelTranslation
      ? `?parallel=${parallelTranslation}`
      : interlinearMode
      ? "?interlinear=1"
      : "";
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
        router.push(`/bible/${translation}/${book}/${chapter + 1}${qs}`);
      } else if (book < 66) {
        const nextBook = BIBLE_BOOKS[book];
        router.push(`/bible/${translation}/${nextBook.id}/1${qs}`);
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

  // Preserve plan + parallel params when translation changes
  const extraSearch = (() => {
    const p = new URLSearchParams();
    if (planId) {
      p.set("planId", planId);
      p.set("day", String(planDay));
      p.set("passage", String(passageIdx));
    }
    if (parallelTranslation) {
      p.set("parallel", parallelTranslation);
    }
    if (interlinearMode) {
      p.set("interlinear", "1");
    }
    return p.toString() || undefined;
  })();

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
        <div className="flex items-center gap-1.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectorOpen(true)}
            className="flex items-center gap-2 font-medium text-sm sm:text-base hover:bg-muted/60 px-3 rounded-lg"
            aria-label="Open book and chapter selector"
          >
            <BookOpen className="h-4 w-4 text-primary/70 shrink-0" />
            <span className="truncate">{bookName} {chapter}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>

          <TranslationSelector
            currentTranslation={translation}
            book={book}
            chapter={chapter}
            extraSearch={extraSearch}
          />

          {/* Parallel toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleParallel}
            className={cn(
              "h-8 w-8 p-0 flex-shrink-0",
              parallelTranslation
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={parallelTranslation ? "Exit parallel view" : "Read in parallel"}
            aria-label={parallelTranslation ? "Exit parallel view" : "Read in parallel"}
          >
            <Columns2 className="h-3.5 w-3.5" />
          </Button>

          {/* Interlinear toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleInterlinear}
            className={cn(
              "h-8 w-8 p-0 flex-shrink-0",
              interlinearMode
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={interlinearMode ? "Exit interlinear view" : "Show Greek/Hebrew interlinear"}
            aria-label={interlinearMode ? "Exit interlinear view" : "Show Greek/Hebrew interlinear"}
          >
            <Languages className="h-3.5 w-3.5" />
          </Button>

          {/* Audio toggle */}
          {onAudioToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAudioToggle}
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0",
                audioActive
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={audioActive ? "Close audio player" : "Listen to chapter"}
              aria-label={audioActive ? "Close audio player" : "Listen to chapter"}
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Reader settings (font size, typeface, theme) */}
          {readerSettings && onIncreaseFontSize && onDecreaseFontSize && onFontFamily && (
            <ReaderSettingsButton
              settings={readerSettings}
              onIncrease={onIncreaseFontSize}
              onDecrease={onDecreaseFontSize}
              canIncrease={canIncreaseFontSize ?? true}
              canDecrease={canDecreaseFontSize ?? true}
              onFontFamily={onFontFamily}
            />
          )}

          {/* Secondary translation selector — only in parallel mode */}
          {parallelTranslation && (
            <Select value={parallelTranslation} onValueChange={changeParallel}>
              <SelectTrigger
                className="h-8 w-auto min-w-[56px] max-w-[80px] border-0 bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary px-2 flex-shrink-0 focus:ring-1"
                aria-label="Select parallel translation"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTranslations.map((t) => (
                  <SelectItem key={t.short_name} value={t.short_name} className="text-sm">
                    <span className="font-semibold">{t.short_name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{t.full_name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
    <Suspense fallback={<ChapterNavSkeleton translation={props.translation} book={props.book} chapter={props.chapter} />}>
      <ChapterNavInner {...props} />
    </Suspense>
  );
}
