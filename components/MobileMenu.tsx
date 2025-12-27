"use client";

import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "./ui/sheet";
import { Menu, Home, MapPin, Info, Phone, LayoutDashboard, ShoppingBag, Settings } from "lucide-react";
import { navbarLinks } from "./NavbarLinks";
import Link from "next/link";
import { cn } from "../lib/utils";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function MobileMenu() {
  const location = usePathname();
  
  // Additional user menu items for mobile
  const userMenuItems = [
    { id: 1, name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { id: 2, name: "My Local Haul", href: "/dashboard/my-local-haul", icon: ShoppingBag },
    { id: 3, name: "Account Settings", href: "/account", icon: Settings },
  ];

  // Map icons to navbar links
  const getIcon = (name: string) => {
    const iconMap: Record<string, any> = {
      "Browse": Home,
      "Market Stands": MapPin,
      "About": Info,
      "Contact": Phone,
    };
    return iconMap[name] || Home;
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          aria-label="Open menu"
          className="text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="bg-[#0B4D2C] p-4">
          <SheetTitle className="text-white">
            <div className="relative w-[140px] h-[35px]">
              <Image
                src="/logos/cornucopia-dark.svg"
                alt="Cornucopia"
                fill
                className="brightness-0 invert"
              />
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col h-[calc(100%-70px)]">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Navigation
              </p>
              {navbarLinks.map((item) => {
                const Icon = getIcon(item.name);
                return (
                  <SheetClose asChild key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg transition-colors",
                        location === item.href
                          ? "bg-[#0B4D2C] text-white"
                          : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
            
            {/* User Section */}
            <div className="mt-6 space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Your Account
              </p>
              {userMenuItems.map((item) => (
                <SheetClose asChild key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg transition-colors",
                      location === item.href
                        ? "bg-[#0B4D2C] text-white"
                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-200 p-4">
            <SheetClose asChild>
              <Link
                href="/product/new"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#8B4513] to-[#D2691E] text-white rounded-lg font-medium text-base hover:opacity-90 transition-opacity active:opacity-80"
              >
                Start Selling
              </Link>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
