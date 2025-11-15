import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";
import { getHomeProducts } from "./actions/home-products";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

async function ProductsLoader() {
  try {
    // Add 8-second timeout to prevent Vercel 10s timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Products fetch timeout')), 8000)
    );
    
    const productsPromise = getHomeProducts(null);
    
    const initialProducts = await Promise.race([
      productsPromise,
      timeoutPromise
    ]);
    
    return <HomeClient initialProducts={initialProducts} />;
  } catch (error: unknown) {
    console.error('Failed to load products:', error);
    // Return empty array on timeout or error - page will still render
    return <HomeClient initialProducts={[]} />;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  const supabase = getSupabaseServer();
  
  // Get session (this is fast, no need to defer)
  const { data: { session } } = await supabase.auth.getSession();

  // Handle authenticated users with returnUrl
  if (session && searchParams.returnUrl) {
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

  // Stream products with Suspense
  return (
    <Suspense
      fallback={
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8">
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <ProductGridSkeleton count={12} />
        </main>
      }
    >
      <ProductsLoader key={session?.user?.id || 'anonymous'} />
    </Suspense>
  );
}
