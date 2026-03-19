"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  BarChart2,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  ShoppingBag,
  MapPin,
  Package,
  Truck,
  Calendar,
} from "lucide-react";

interface MenuItem {
  name: string;
  icon: any;
  href: string;
  producerOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Purchases", icon: ShoppingBag, href: "/dashboard/purchases" },
  { name: "Market Stands", icon: MapPin, href: "/market-stand/grid" },
];

const producerMenuItems: MenuItem[] = [
  { name: "Farm Page Management", icon: Store, href: "/dashboard/farm-page", producerOnly: true },
  { name: "My Products", icon: Package, href: "/dashboard/products", producerOnly: true },
  { name: "Delivery", icon: Truck, href: "/dashboard/delivery-zones", producerOnly: true },
  { name: "Market Stand Setup", icon: MapPin, href: "/dashboard/market-stand", producerOnly: true },
  { name: "Events", icon: Calendar, href: "/dashboard/events", producerOnly: true },
  { name: "Orders & Sales", icon: ShoppingCart, href: "/dashboard/orders", producerOnly: true },
  { name: "Analytics & Reports", icon: BarChart2, href: "/dashboard/analytics", producerOnly: true },
];

const accountItems: MenuItem[] = [
  { name: "Account", icon: Settings, href: "/account" },
  { name: "Billing", icon: CreditCard, href: "/billing" },
];

const bottomMenuItems = [
  { name: "Support & Help", icon: HelpCircle, href: "/dashboard/support" },
  { name: "Log Out", icon: LogOut, href: "/auth/logout" },
];

interface SidebarProps {
  isProducer: boolean;
  onNavigate?: () => void;
}

export function SidebarContent({ isProducer, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      <nav aria-label="Dashboard navigation" className="flex-1 px-3 pt-3 pb-4 overflow-y-auto">
        <div className="space-y-1">
          {/* Common menu items */}
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[#8B4513] text-white"
                  : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Producer-only section with divider */}
          {isProducer ? (
            <>
              <div className="my-2 border-t border-gray-200" />
              {producerMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
              onClick={onNavigate}
                  className={`flex items-center space-x-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-[#8B4513] text-white"
                      : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </>
          ) : (
            <>
              <div className="my-2 border-t border-gray-200" />
              <Link
                href="/product/new"
                onClick={onNavigate}
                className="flex items-center space-x-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#8B4513] to-[#D2691E] text-white hover:opacity-90 transition-opacity"
              >
                <Package className="h-5 w-5" />
                <span>Become a Producer</span>
              </Link>
            </>
          )}

          {/* Account section */}
          <div className="my-2 border-t border-gray-200" />
          {accountItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[#8B4513] text-white"
                  : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
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
            className="flex items-center space-x-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function Sidebar({ isProducer }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0">
      <SidebarContent isProducer={isProducer} />
    </aside>
  );
}
