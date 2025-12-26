import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";
import { getHomeProducts } from "./actions/geo-products";
import { getFastHomeProducts } from "./actions/cached-products";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

/**
 * Timeout wrapper for async operations
 * Critical for serverless cold starts on Vercel Hobby (10s limit)
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]);
}

/**
 * Load products with fallback strategy for cold starts
 * 
 * Strategy:
 * 1. Try geo products with 6s timeout (leaves 4s buffer for rendering)
 * 2. On timeout/error, fall back to fast cached products
 * 3. If everything fails, return empty array (UI still renders)
 */
async function ProductsLoader() {
  try {
    // Attempt geo products with timeout for cold start protection
    // 6 second timeout leaves buffer for other operations within 10s limit
    const geoProducts = await withTimeout(getHomeProducts(), 6000);
    
    if (geoProducts && geoProducts.length > 0) {
      return <HomeClient initialProducts={geoProducts} />;
    }
    
    // Geo query timed out or returned empty - try fast fallback
    console.log('Geo products timed out or empty, using fast fallback');
    const fallbackProducts = await withTimeout(getFastHomeProducts(), 2000);
    
    if (fallbackProducts && fallbackProducts.length > 0) {
      return <HomeClient initialProducts={fallbackProducts} />;
    }
    
    // Both failed - render empty state
    console.warn('Both geo and fallback products failed');
    return <HomeClient initialProducts={[]} />;
  } catch (error: unknown) {
    console.error('Failed to load products:', error);
    
    // Last resort - try fast fallback on error
    try {
      const emergencyFallback = await getFastHomeProducts();
      return <HomeClient initialProducts={emergencyFallback} />;
    } catch {
      // Complete failure - render empty state
      return <HomeClient initialProducts={[]} />;
    }
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  // OPTIMIZATION: Only call getUser() if we actually need to check for redirect
  // This prevents blocking the page render for anonymous users on cold starts
  if (searchParams.returnUrl) {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Handle authenticated users with returnUrl
    if (user) {
      const decodedUrl = decodeURIComponent(searchParams.returnUrl);
      const protectedRoutes = [
        '/sell',
        '/settings',
        '/dashboard/market-stand/setup',
        '/billing',
        '/dashboard/market-stand',
        '/dashboard/settings'
      ];

      // Only redirect to protected routes
      if (protectedRoutes.some(route => decodedUrl.startsWith(route))) {
        redirect(decodedUrl);
      }
    }
  }

  // Stream products with Suspense - most users hit this path without auth check
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-80px)]">
          <aside className="w-64 bg-white border-r border-gray-200">
            <div className="p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-5 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>
          <main className="flex-1 px-4 md:px-8 py-8">
            <ProductGridSkeleton count={12} />
          </main>
        </div>
      }
    >
      <ProductsLoader />
    </Suspense>
  );
}
