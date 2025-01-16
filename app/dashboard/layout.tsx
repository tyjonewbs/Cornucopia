import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, Settings, Package } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    return redirect('/');
  }

  const navItems = [
    {
      href: "/dashboard/market-stand",
      label: "Market Stand",
      icon: Store,
    },
    {
      href: "/dashboard/sell",
      label: "Products",
      icon: Package,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Dashboard</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="block"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
