import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";
import { getHomeProducts } from "./actions/geo-products";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

async function ProductsLoader() {
  try {
    const initialProducts = await getHomeProducts();
    return <HomeClient initialProducts={initialProducts} />;
  } catch (error: unknown) {
    console.error('Failed to load products:', error);
    // Return empty array on error - page will still render
    return <HomeClient initialProducts={[]} />;
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
          <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-64 bg-white border-r border-gray-200">
            <div className="p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-5 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>
          <main className="flex-1 ml-64 px-4 md:px-8 py-8">
            <ProductGridSkeleton count={12} />
          </main>
        </div>
      }
    >
      <ProductsLoader />
    </Suspense>
  );
}
