import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 lg:pb-10 space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Verse of the day */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>

      {/* Streak */}
      <Skeleton className="h-48 w-full rounded-xl" />

      {/* Quick access grid */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
