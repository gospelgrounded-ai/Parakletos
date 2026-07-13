import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterLoading() {
  return (
    <div className="min-h-screen">
      {/* Sticky nav placeholder */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Verse lines */}
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-4">
        <Skeleton className="h-10 w-24" />
        {[...Array(9)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-5"
            style={{ width: `${88 - (i % 3) * 9}%` }}
          />
        ))}
      </div>
    </div>
  );
}
