export interface AppSidebarProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  headerHref?: string;
}

export interface SidebarHeaderProps {
  href?: string;
  className?: string;
}
