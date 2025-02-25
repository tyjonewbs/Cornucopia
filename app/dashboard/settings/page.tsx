export const dynamic = 'force-dynamic';

import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, Store, User } from "lucide-react";

export default async function SettingsDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/');
  }

  const settingsCards = [
    {
      title: "Profile Settings",
      description: "Update your personal information and preferences",
      icon: User,
      href: "/settings",
    },
    {
      title: "Payment Settings",
      description: "Manage your payment methods and billing information",
      icon: CreditCard,
      href: "/billing",
    },
    {
      title: "Market Stand Settings",
      description: "Configure your market stand preferences",
      icon: Store,
      href: "/dashboard/market-stand/setup",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <Icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full">
                    View Settings
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your current account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Name</div>
              <div className="text-sm text-muted-foreground">
                {user?.user_metadata?.given_name} {user?.user_metadata?.family_name}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Account Created</div>
              <div className="text-sm text-muted-foreground">
                {new Date(user?.created_at!).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
