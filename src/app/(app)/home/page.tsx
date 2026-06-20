import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBook } from "@/lib/bible-books";
import Link from "next/link";
import StreakWidget from "@/components/streak/StreakWidget";
import { BookOpen, Calendar, Bookmark, ArrowRight, Flame } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Fetch reading progress, active plan, and streak in parallel
  const [progress, enrollments] = await Promise.all([
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
  ]);

  const bookInfo = progress ? getBook(progress.book) : null;
  const firstName = session!.user!.name?.split(" ")[0] ?? "friend";

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

      {/* Streak widget — client component */}
      <StreakWidget />

      {/* Continue reading */}
      {progress && bookInfo && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Continue Reading
          </h2>
          <Link
            href={`/bible/${progress.translation}/${progress.book}/${progress.chapter}`}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {bookInfo.name} {progress.chapter}
              </p>
              <p className="text-sm text-muted-foreground">
                {progress.translation}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        </section>
      )}

      {/* Active reading plans */}
      {enrollments.length > 0 && (
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
            href="/search"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
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
            href="/bible"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <Flame className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium">Open Bible</span>
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
