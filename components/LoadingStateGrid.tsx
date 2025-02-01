import { Skeleton } from "./ui/skeleton";

export default function LoadingStateGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="mb-12">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="relative aspect-[4/3] w-full">
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <Skeleton className="h-7 w-20 rounded-md" /> {/* Timer placeholder */}
                </div>
                <Skeleton className="w-full h-full" />
              </div>
              <div className="p-3 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/2" /> {/* Product name */}
                  <Skeleton className="h-6 w-20" /> {/* Price */}
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" /> {/* Location */}
                  <Skeleton className="h-4 w-24" /> {/* Distance */}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-md" /> {/* Tag */}
                  <Skeleton className="h-6 w-16 rounded-md" /> {/* Tag */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
