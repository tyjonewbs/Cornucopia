import { getMarketStands } from "@/app/actions/market-stands";
import { MarketStandsGrid } from "./MarketStandsGrid";
import { Suspense } from "react";

// Force dynamic rendering - page fetches data from database
export const dynamic = 'force-dynamic'
export const revalidate = 0

function LoadingGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Stands</h1>
        <p className="text-muted-foreground mt-2">Loading market stands...</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function MarketStandsGridPage() {
  const initialStands = await getMarketStands();
  
  return (
    <Suspense fallback={<LoadingGrid />}>
      <MarketStandsGrid initialStands={initialStands} />
    </Suspense>
  );
}
