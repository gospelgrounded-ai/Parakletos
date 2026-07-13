"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, ChevronDown, BookOpen, Calendar,
  Columns2, Languages, Volume2, MoreHorizontal, Check, Minus, Plus,
} from "lucide-react";
import { type FontFamily, type ReaderSettings } from "@/hooks/useReaderSettings";
import { Button } from "@/components/ui/button";
import { getBook, BIBLE_BOOKS } from "@/lib/bible-books";
import { cn } from "@/lib/utils";
import BookChapterSelector from "./BookChapterSelector";
import TranslationSelector from "./TranslationSelector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const { theme, setTheme } = useTheme();

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

  const flat: FlatPassage[] = plan?.days ? flattenPlan(plan.days as PlanDay[]) : [];
  const currentFlatIdx = planId
    ? flat.findIndex((p) => p.day === planDay && p.passageIdx === passageIdx)
    : -1;
  const inPlanMode = planId != null && currentFlatIdx >= 0;

  const prevEntry = inPlanMode ? (flat[currentFlatIdx - 1] ?? null) : null;
  const nextEntry = inPlanMode ? (flat[currentFlatIdx + 1] ?? null) : null;

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
      params.delete("parallel");
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
        if (nextEntry.day > planDay) markDayComplete();
        router.push(planUrl(nextEntry));
      } else {
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

  // Keyboard chapter paging (←/→). Uses a "latest ref" so the listener
  // never needs to be re-registered while still calling the current
  // navigatePrev/navigateNext closures.
  const navigatePrevRef = useRef(navigatePrev);
  const navigateNextRef = useRef(navigateNext);
  navigatePrevRef.current = navigatePrev;
  navigateNextRef.current = navigateNext;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectorOpen) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigatePrevRef.current();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateNextRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectorOpen]);

  function prevLabel() {
    if (inPlanMode && prevEntry) {
      if (prevEntry.day < planDay) return `Day ${prevEntry.day}`;
      const b = getBook(prevEntry.book);
      return `${b?.shortName ?? ""} ${prevEntry.chapter}`;
    }
    return "Prev";
  }

  function nextLabel() {
    if (inPlanMode) {
      if (!nextEntry) return "Done";
      if (nextEntry.day > planDay) return `Day ${nextEntry.day}`;
      const b = getBook(nextEntry.book);
      return `${b?.shortName ?? ""} ${nextEntry.chapter}`;
    }
    return "Next";
  }

  const extraSearch = (() => {
    const p = new URLSearchParams();
    if (planId) {
      p.set("planId", planId);
      p.set("day", String(planDay));
      p.set("passage", String(passageIdx));
    }
    if (parallelTranslation) p.set("parallel", parallelTranslation);
    if (interlinearMode) p.set("interlinear", "1");
    return p.toString() || undefined;
  })();

  const hasActiveFeature = !!(parallelTranslation || interlinearMode || audioActive);
  const hasReaderSettings = !!(readerSettings && onIncreaseFontSize && onDecreaseFontSize && onFontFamily);

  return (
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
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{prevLabel()}</span>
        </Button>

        {/* Center: chapter selector + translation + overflow */}
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

          {/* ⋯ overflow menu — all secondary tools in one place */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Reading tools"
              >
                <MoreHorizontal className="h-4 w-4" />
                {hasActiveFeature && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-3" align="end">
              <div className="space-y-0.5">
                {/* Parallel view */}
                <button
                  onClick={toggleParallel}
                  className={cn(
                    "flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-sm transition-colors text-left",
                    parallelTranslation
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Columns2 className="h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Parallel view</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {parallelTranslation
                        ? `Reading ${parallelTranslation} alongside`
                        : "Read two translations side-by-side"}
                    </p>
                  </div>
                  {parallelTranslation && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>

                {/* Parallel translation picker — visible when active */}
                {parallelTranslation && (
                  <div className="ml-9 mb-1">
                    <Select value={parallelTranslation} onValueChange={changeParallel}>
                      <SelectTrigger
                        className="h-7 text-xs border-primary/20 focus:ring-1"
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
                  </div>
                )}

                {/* Interlinear */}
                <button
                  onClick={toggleInterlinear}
                  className={cn(
                    "flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-sm transition-colors text-left",
                    interlinearMode
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Languages className="h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Interlinear</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Greek / Hebrew word-for-word</p>
                  </div>
                  {interlinearMode && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>

                {/* Listen */}
                {onAudioToggle && (
                  <button
                    onClick={onAudioToggle}
                    className={cn(
                      "flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-sm transition-colors text-left",
                      audioActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Volume2 className="h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">Listen</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Audio Bible player</p>
                    </div>
                    {audioActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                )}
              </div>

              {/* Text & theme settings */}
              {hasReaderSettings && (
                <>
                  <div className="border-t my-2" />

                  {/* Font size */}
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Font size
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={onDecreaseFontSize}
                        disabled={!canDecreaseFontSize}
                        aria-label="Decrease font size"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex-1 text-center text-sm font-medium tabular-nums">
                        {Math.round(readerSettings!.fontSize)}%
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={onIncreaseFontSize}
                        disabled={!canIncreaseFontSize}
                        aria-label="Increase font size"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Typeface */}
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Typeface
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["serif", "sans"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => onFontFamily!(f)}
                          className={cn(
                            "py-2 px-3 rounded-md border text-sm transition-colors",
                            readerSettings!.fontFamily === f
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border text-muted-foreground hover:border-foreground/40"
                          )}
                          style={{
                            fontFamily:
                              f === "serif"
                                ? "var(--font-serif), Georgia, serif"
                                : "var(--font-sans), system-ui, sans-serif",
                          }}
                        >
                          {f === "serif" ? "Serif" : "Sans"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Theme
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={cn(
                            "py-2 px-1 rounded-md border text-xs capitalize transition-colors",
                            theme === t
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border text-muted-foreground hover:border-foreground/40"
                          )}
                        >
                          {t === "system" ? "Auto" : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateNext}
          disabled={nextDisabled}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
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
