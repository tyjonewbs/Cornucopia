import { Card } from "../../../../components/ui/card";
import { Skeleton } from "../../../../components/ui/skeleton";

export default function EditProductLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Card>
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
