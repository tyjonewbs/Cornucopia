import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden shadow-md">
      <div className="relative aspect-[4/3] w-full">
        <Skeleton className="w-full h-full rounded-t-lg" />
        <div className="absolute top-2 right-2 flex gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
      <div className="p-3 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
