import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./home-client";

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

  // If user is authenticated but no returnUrl, show home page
  // If user is not authenticated, show home page
  return <HomeClient />;
}
