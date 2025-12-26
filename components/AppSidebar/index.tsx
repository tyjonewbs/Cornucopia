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
      className={`w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}
    >
      {showHeader && <SidebarHeader href={headerHref} />}
      {children}
    </aside>
  );
}

export { SidebarHeader } from "./SidebarHeader";
export type { AppSidebarProps, SidebarHeaderProps } from "./types";
