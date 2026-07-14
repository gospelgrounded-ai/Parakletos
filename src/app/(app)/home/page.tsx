import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBook } from "@/lib/bible-books";
import Link from "next/link";
import StreakWidget from "@/components/streak/StreakWidget";
import VerseOfTheDayCard from "@/components/home/VerseOfTheDayCard";
import { getVerseOfTheDay } from "@/lib/votd";
import {
  BookOpen,
  Calendar,
  Bookmark,
  ArrowRight,
  Search,
  HandHeart,
  Brain,
  Sun,
} from "lucide-react";

interface TodayAction {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Fetch reading progress, active plans, streak, and memory-verse due count in parallel
  const [progress, enrollments, dueMemoryCount] = await Promise.all([
    db.readingProgress.findUnique({ where: { userId } }),
    db.planEnrollment.findMany({
      where: { userId, completedAt: null },
      include: {
        plan: {
          select: { title: true, totalDays: true, coverColor: true, id: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 2,
    }),
    db.memoryVerse.count({ where: { userId, nextReview: { lte: new Date() } } }),
  ]);

  const votd = await getVerseOfTheDay(progress?.translation ?? "KJV");

  const bookInfo = progress ? getBook(progress.book) : null;
  const firstName = session!.user!.name?.split(" ")[0] ?? "friend";
  const translation = progress?.translation ?? "KJV";

  // ── "Today" actions — the page's single priority ──────────────────────────
  const todayActions: TodayAction[] = [];

  if (progress && bookInfo) {
    todayActions.push({
      href: `/bible/${progress.translation}/${progress.book}/${progress.chapter}`,
      icon: <BookOpen className="h-5 w-5 text-primary" />,
      title: `Continue reading ${bookInfo.name} ${progress.chapter}`,
      subtitle: progress.translation,
    });
  }

  // Today's passage for the most recent active plan — deep-link straight to it
  const currentEnrollment = enrollments[0];
  if (currentEnrollment) {
    let planHref = `/plans/${currentEnrollment.planId}`;
    let planSubtitle = `Day ${currentEnrollment.currentDay} of ${currentEnrollment.plan.totalDays}`;
    const planDay = await db.planDay
      .findUnique({
        where: {
          planId_dayNumber: {
            planId: currentEnrollment.planId,
            dayNumber: currentEnrollment.currentDay,
          },
        },
        select: { passages: true },
      })
      .catch(() => null);
    if (planDay) {
      try {
        const passages: Array<{ book: number; chapter: number }> = JSON.parse(
          planDay.passages
        );
        const first = Array.isArray(passages) ? passages[0] : undefined;
        if (first) {
          planHref = `/bible/${translation}/${first.book}/${first.chapter}?planId=${currentEnrollment.planId}&day=${currentEnrollment.currentDay}&passage=0`;
          const b = getBook(first.book);
          planSubtitle = `Day ${currentEnrollment.currentDay}: ${b?.name ?? ""} ${first.chapter}`;
        }
      } catch {
        // malformed passages — fall back to the plan page link
      }
    }
    todayActions.push({
      href: planHref,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      title: `Read today's passage — ${currentEnrollment.plan.title}`,
      subtitle: planSubtitle,
    });
  }

  if (dueMemoryCount > 0) {
    todayActions.push({
      href: "/memorize",
      icon: <Brain className="h-5 w-5 text-primary" />,
      title: `Review ${dueMemoryCount} memory verse${dueMemoryCount === 1 ? "" : "s"}`,
      subtitle: "Keep the Word hidden in your heart",
    });
  }

  if (todayActions.length === 0) {
    todayActions.push({
      href: `/bible/${translation}/43/1`,
      icon: <BookOpen className="h-5 w-5 text-primary" />,
      title: "Start reading — John 1",
      subtitle: translation,
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 lg:pb-10 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Good{getTimeOfDay()}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Today — the page's one primary card */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Sun className="h-3.5 w-3.5" />
          Today
        </h2>
        <div className="rounded-xl border-2 border-primary/20 bg-card divide-y overflow-hidden">
          {todayActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 p-4 min-h-[56px] hover:bg-muted/50 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {action.subtitle}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Verse of the Day */}
      {votd && (
        <VerseOfTheDayCard
          book={votd.book}
          chapter={votd.chapter}
          verse={votd.verse}
          reference={votd.reference}
          text={votd.text}
          translation={translation}
        />
      )}

      {/* Streak — status, not action; compact by design */}
      <StreakWidget />

      {/* Active reading plans — only when the Today card can't cover them all */}
      {enrollments.length > 1 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Active Plans
          </h2>
          <div className="space-y-2">
            {enrollments.map((e) => {
              const pct = Math.round((e.currentDay / e.plan.totalDays) * 100);
              return (
                <Link
                  key={e.id}
                  href={`/plans/${e.planId}`}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: e.plan.coverColor + "22" }}
                  >
                    <Calendar
                      className="h-5 w-5"
                      style={{ color: e.plan.coverColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">
                      {e.plan.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: e.plan.coverColor,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        Day {e.currentDay}/{e.plan.totalDays}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/bible"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Open Bible</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <Search className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Search Scripture</span>
          </Link>
          <Link
            href="/library"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <Bookmark className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Your Library</span>
          </Link>
          <Link
            href="/plans"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Reading Plans</span>
          </Link>
          <Link
            href="/prayer"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <HandHeart className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Prayer Journal</span>
          </Link>
          <Link
            href="/memorize"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors relative"
          >
            <Brain className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Memorize</span>
            {dueMemoryCount > 0 && (
              <span className="ml-auto shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                {dueMemoryCount}
              </span>
            )}
          </Link>
        </div>
      </section>
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
