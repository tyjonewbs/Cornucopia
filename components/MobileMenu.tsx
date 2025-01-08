"use client";

import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { Menu } from "lucide-react";
import { navbarLinks } from "./NavbarLinks";
import Link from "next/link";
import { cn } from "../lib/utils";
import { usePathname } from "next/navigation";

export function MobileMenu() {
  const location = usePathname();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <nav className="mt-6 flex flex-col gap-1">
          {navbarLinks.map((item) => (
            <SheetClose asChild key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                )}
              >
                {item.name}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
