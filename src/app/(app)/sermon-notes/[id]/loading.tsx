import { Skeleton } from "@/components/ui/skeleton";

export default function SermonNoteLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8 space-y-6">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-10 w-2/3" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
