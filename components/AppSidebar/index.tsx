"use client";

import { useState } from "react";
import { AppSidebarProps } from "./types";
import { SidebarHeader } from "./SidebarHeader";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Filter } from "lucide-react";

export function AppSidebar({
  children,
  className = "",
  showHeader = true,
  headerHref = "/",
}: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside
        className={`hidden md:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0 ${className}`}
      >
        {showHeader && <SidebarHeader href={headerHref} />}
        {children}
      </aside>

      {/* Mobile Filter Button - fixed above bottom nav */}
      <div className="md:hidden fixed bottom-20 left-4 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg bg-[#0B4D2C] hover:bg-[#0B4D2C]/90 h-14 w-14"
            >
              <Filter className="h-6 w-6" />
              <span className="sr-only">Open filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export { SidebarHeader } from "./SidebarHeader";
export type { AppSidebarProps, SidebarHeaderProps } from "./types";
