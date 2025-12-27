"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Markets", href: "/market-stand/grid", icon: MapPin },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Account", href: "/dashboard", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
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
      </div>
    </nav>
  );
}
