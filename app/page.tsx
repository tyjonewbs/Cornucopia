import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";
import { getHomeProducts } from "./actions/home-products";

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

  // Fetch initial products at the page level
  const initialProducts = await getHomeProducts(null);

  return <HomeClient initialProducts={initialProducts} />;
}
