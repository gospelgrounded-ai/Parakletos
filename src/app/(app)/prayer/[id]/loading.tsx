import { Skeleton } from "@/components/ui/skeleton";

export default function PrayerEntryLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8 space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-9 w-36 rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
