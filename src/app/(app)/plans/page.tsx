"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BookOpen, CheckCircle2 } from "lucide-react";

interface ReadingPlan {
  id: string;
  slug: string;
  title: string;
  description: string;
  totalDays: number;
  coverColor: string;
  enrolled: boolean;
  currentDay: number | null;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

function PlanCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="h-24 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full mt-3" />
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  );
}

function ProgressBar({
  currentDay,
  totalDays,
}: {
  currentDay: number;
  totalDays: number;
}) {
  const percent = Math.min(100, Math.round((currentDay / totalDays) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Day {currentDay} of {totalDays}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: ReadingPlan }) {
  const router = useRouter();
  const isComplete =
    plan.enrolled && plan.currentDay !== null && plan.currentDay >= plan.totalDays;

  function handleAction() {
    if (!plan.enrolled) {
      // Enroll then navigate
      fetch("/api/reading-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      }).then(() => {
        router.push(`/plans/${plan.slug}`);
      });
    } else {
      router.push(`/plans/${plan.slug}`);
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden flex flex-col">
      {/* Color header */}
      <div
        className="h-20 flex items-center justify-center"
        style={{ backgroundColor: plan.coverColor }}
      >
        <BookOpen className="h-8 w-8 text-white/80" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-semibold text-base leading-snug mb-1">
            {plan.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {plan.description}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {plan.totalDays} days
          </p>
        </div>

        {/* Progress bar if enrolled */}
        {plan.enrolled && plan.currentDay !== null && (
          <div className="mt-3">
            {isComplete ? (
              <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            ) : (
              <ProgressBar
                currentDay={plan.currentDay}
                totalDays={plan.totalDays}
              />
            )}
          </div>
        )}

        <button
          onClick={handleAction}
          className={cn(
            "mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            plan.enrolled
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isComplete ? "Review" : plan.enrolled ? "Continue" : "Start Plan"}
        </button>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const { data, isLoading } = useSWR<{ plans: ReadingPlan[] }>(
    "/api/reading-plans",
    fetcher
  );

  const plans = data?.plans ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold mb-6">Reading Plans</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No reading plans available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
