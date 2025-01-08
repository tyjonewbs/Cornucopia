import { Card } from "../../../../components/ui/card";
import { Skeleton } from "../../../../components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Card>
        <div className="p-6 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>

          <div className="space-y-6">
            {/* Name field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-32 w-full" />
            </div>

            {/* Location Name field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Location Guide field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-32 w-full" />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Images section */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>
      </Card>
    </div>
  );
}
