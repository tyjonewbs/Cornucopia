import { ProductRow } from "../components/ProductRow";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";

export default async function Home({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  const supabase = getSupabaseServer();
  
  // Get session
  const { data: { session }, error } = await supabase.auth.getSession();

  // Log auth state for debugging
  console.log('Auth state:', {
    hasSession: !!session,
    returnUrl: searchParams.returnUrl,
    error: error?.message
  });

  // Handle authenticated users with returnUrl
  if (session && searchParams.returnUrl) {
    const decodedUrl = decodeURIComponent(searchParams.returnUrl);
    const protectedRoutes = [
      '/sell',
      '/settings',
      '/market-stand/setup',
      '/billing',
      '/product',
      '/dashboard/market-stand',
      '/dashboard/sell',
      '/dashboard/settings'
    ];

    // Only redirect to protected routes
    if (protectedRoutes.some(route => decodedUrl.startsWith(route))) {
      redirect(decodedUrl);
    }
  }

  // If user is authenticated but no returnUrl, show home page
  // If user is not authenticated, show home page
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <div className="text-2xl sm:text-5xl lg:text-6xl font-semibold text-center py-24 mt-12 bg-secondary rounded-lg mb-20 shadow-sm">
        <h1 className="text-foreground/90">Discover Fresh Local</h1>
        <h1 className="text-primary font-bold">Farm Products</h1>
        <p className="lg:text-lg text-muted-foreground mx-auto mt-8 w-[90%] max-w-3xl font-normal text-base">
          Find the freshest products from local farmstands near you. Support your local
          farmers and enjoy farm-fresh goods delivered directly to you.
        </p>
      </div>
      <ProductRow 
        title="Local Products" 
        link="/local-spots"
      />
    </section>
  );
}
