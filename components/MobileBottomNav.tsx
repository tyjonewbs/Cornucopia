"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, User, LayoutDashboard, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createBrowserClient } from "@supabase/ssr";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: user, isAuthenticated } = useAuth();
  const [isProducer, setIsProducer] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsProducer(false);
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check products OR market stands — either makes them a producer
    Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("userId", user.id)
        .eq("isActive", true),
      supabase
        .from("MarketStand")
        .select("id", { count: "exact", head: true })
        .eq("userId", user.id)
        .eq("isActive", true),
    ]).then(([products, stands]) => {
      setIsProducer((products.count ?? 0) > 0 || (stands.count ?? 0) > 0);
    });
  }, [user?.id]);

  // Tab 1: Home - active if pathname === "/"
  const isHomeActive = pathname === "/";

  // Tab 2: Markets - active if pathname starts with "/market-stand"
  const isMarketsActive = pathname?.startsWith("/market-stand");

  // Tab 3: Account - active if pathname starts with "/account" OR "/dashboard/purchases" OR "/dashboard/my-local-haul"
  const isAccountActive =
    pathname?.startsWith("/account") ||
    pathname?.startsWith("/dashboard/purchases") ||
    pathname?.startsWith("/dashboard/my-local-haul");

  // Tab 4: Dashboard/Sell - active if pathname starts with "/dashboard" (except purchases/haul which belong to Account)
  const isDashboardActive =
    pathname?.startsWith("/dashboard") &&
    !pathname?.startsWith("/dashboard/purchases") &&
    !pathname?.startsWith("/dashboard/my-local-haul");

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {/* Tab 1: Home */}
        <Link
          href="/"
          aria-current={isHomeActive ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation min-w-0",
            isHomeActive
              ? "text-[#0B4D2C]"
              : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
          )}
        >
          <Home
            className={cn(
              "h-6 w-6 mb-1",
              isHomeActive && "stroke-[2.5px]"
            )}
          />
          <span className={cn(
            "text-xs",
            isHomeActive ? "font-semibold" : "font-medium"
          )}>
            Home
          </span>
        </Link>

        {/* Tab 2: Markets */}
        <Link
          href="/market-stand"
          aria-current={isMarketsActive ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation min-w-0",
            isMarketsActive
              ? "text-[#0B4D2C]"
              : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
          )}
        >
          <MapPin
            className={cn(
              "h-6 w-6 mb-1",
              isMarketsActive && "stroke-[2.5px]"
            )}
          />
          <span className={cn(
            "text-xs",
            isMarketsActive ? "font-semibold" : "font-medium"
          )}>
            Markets
          </span>
        </Link>

        {/* Tab 3: Account */}
        <Link
          href="/account"
          aria-current={isAccountActive ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation min-w-0",
            isAccountActive
              ? "text-[#0B4D2C]"
              : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
          )}
        >
          <User
            className={cn(
              "h-6 w-6 mb-1",
              isAccountActive && "stroke-[2.5px]"
            )}
          />
          <span className={cn(
            "text-xs",
            isAccountActive ? "font-semibold" : "font-medium"
          )}>
            Account
          </span>
        </Link>

        {/* Tab 4: Dashboard/Sell */}
        {isProducer ? (
          // Producer: Dashboard tab with normal styling
          <Link
            href="/dashboard"
            aria-current={isDashboardActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation min-w-0",
              isDashboardActive
                ? "text-[#0B4D2C]"
                : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
            )}
          >
            <LayoutDashboard
              className={cn(
                "h-6 w-6 mb-1",
                isDashboardActive && "stroke-[2.5px]"
              )}
            />
            <span className={cn(
              "text-xs",
              isDashboardActive ? "font-semibold" : "font-medium"
            )}>
              Dashboard
            </span>
          </Link>
        ) : (
          // Non-producer: Sell CTA with green pill styling
          <Link
            href="/onboarding/producer"
            className="flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation min-w-0 text-[#0B4D2C]"
          >
            <div className="bg-[#0B4D2C] rounded-full p-1.5 mb-1">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-[#0B4D2C]">Sell</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
