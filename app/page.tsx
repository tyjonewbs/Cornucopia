export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static page generation

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";
import { getHomeProducts } from "./actions/home-products";

export default async function Home({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  try {
    const supabase = getSupabaseServer();
    
    // Get session
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
        '/dashboard/sell',
        '/dashboard/settings'
      ];

      // Only redirect to protected routes
      if (protectedRoutes.some(route => decodedUrl.startsWith(route))) {
        redirect(decodedUrl);
      }
    }

    // Cache initial products for 30 seconds
    const initialProducts = await getHomeProducts(null);
    
    // Return the client component with initial data
    return (
      <HomeClient 
        key={session?.user?.id || 'anonymous'} 
        initialProducts={initialProducts} 
      />
    );
  } catch (error: unknown) {
    console.error('Failed to load homepage:', {
      error,
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL
    });
    
    // Return empty state instead of throwing
    return <HomeClient initialProducts={[]} />;
  }
}
