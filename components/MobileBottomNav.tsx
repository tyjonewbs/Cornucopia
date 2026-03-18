"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Heart, ShoppingBag, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { createBrowserClient } from "@supabase/ssr";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Markets", href: "/market-stand/grid", icon: MapPin },
  { name: "Saved", href: "/dashboard/my-local-haul", icon: Heart },
  { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: user, isAuthenticated } = useAuth();
  const [isProducer, setIsProducer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/account") || pathname?.startsWith("/billing");

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation",
                active
                  ? "text-[#0B4D2C]"
                  : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 mb-1",
                  active && "stroke-[2.5px]"
                )}
              />
              <span className={cn(
                "text-xs",
                active ? "font-semibold" : "font-medium"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Menu button - replaces Account */}
        {isAuthenticated ? (
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation",
                  isDashboard
                    ? "text-[#0B4D2C]"
                    : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
                )}
              >
                <Menu
                  className={cn(
                    "h-6 w-6 mb-1",
                    isDashboard && "stroke-[2.5px]"
                  )}
                />
                <span className={cn(
                  "text-xs",
                  isDashboard ? "font-semibold" : "font-medium"
                )}>
                  Menu
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Dashboard Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col flex-1 overflow-hidden">
                <SidebarContent isProducer={isProducer} />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors touch-manipulation",
              isDashboard
                ? "text-[#0B4D2C]"
                : "text-gray-500 hover:text-gray-700 active:text-[#0B4D2C]"
            )}
          >
            <Menu
              className={cn(
                "h-6 w-6 mb-1",
                isDashboard && "stroke-[2.5px]"
              )}
            />
            <span className={cn(
              "text-xs",
              isDashboard ? "font-semibold" : "font-medium"
            )}>
              Menu
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
