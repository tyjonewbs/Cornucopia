"use client";

import { AppSidebarProps } from "./types";
import { SidebarHeader } from "./SidebarHeader";

export function AppSidebar({
  children,
  className = "",
  showHeader = true,
  headerHref = "/",
}: AppSidebarProps) {
  return (
    <aside
      className={`absolute left-0 top-20 w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}
    >
      {showHeader && <SidebarHeader href={headerHref} />}
      {children}
    </aside>
  );
}

export { SidebarHeader } from "./SidebarHeader";
export type { AppSidebarProps, SidebarHeaderProps } from "./types";
