import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";
import { getHomeProducts } from "./actions/home-products";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  const supabase = getSupabaseServer();
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // Handle authenticated users with returnUrl
  if (session && searchParams.returnUrl) {
    const decodedUrl = decodeURIComponent(searchParams.returnUrl);
    const protectedRoutes = [
      '/sell',
      '/settings',
      '/market-stand/setup',
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

  try {
    // Fetch initial products at the page level
    const initialProducts = await getHomeProducts(null);
    return <HomeClient initialProducts={initialProducts} />;
  } catch (error) {
    console.error('Failed to load homepage:', {
      error,
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL
    });
    throw error; // Let Next.js error boundary handle it
  }
}
