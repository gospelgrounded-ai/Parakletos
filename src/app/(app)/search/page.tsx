import { Suspense } from "react";
import SearchInterface from "@/components/search/SearchInterface";
import { Skeleton } from "@/components/ui/skeleton";

function SearchFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-40" />
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold mb-6">Search Scripture</h1>
      <Suspense fallback={<SearchFallback />}>
        <SearchInterface />
      </Suspense>
    </div>
  );
}
