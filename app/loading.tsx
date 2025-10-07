import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <ProductGridSkeleton count={12} />
    </main>
  );
}
