"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Calendar,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Farm Page Management", icon: Store, href: "/dashboard/farm-page" },
  { name: "Product Catalog", icon: Package, href: "/dashboard/sell" },
  { name: "Market Stand", icon: Store, href: "/dashboard/market-stand" },
  { name: "Orders & Sales", icon: ShoppingCart, href: "/dashboard/orders" },
  { name: "Events & Activities", icon: Calendar, href: "/dashboard/events" },
  { name: "Analytics & Reports", icon: BarChart2, href: "/dashboard/analytics" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const bottomMenuItems = [
  { name: "Support & Help", icon: HelpCircle, href: "/dashboard/support" },
  { name: "Log Out", icon: LogOut, href: "/auth/logout" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Image 
          src="/logos/cornucopia-dark.svg" 
          alt="Cornucopia"
          width={120}
          height={32}
          priority
        />
      </div>
      
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[#8B4513] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-gray-200 px-3 py-4">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
