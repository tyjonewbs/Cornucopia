import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MarketStandCard } from "@/components/MarketStandCard";
import { redirect } from "next/navigation";

async function getMarketStands(userId: string) {
  try {
    return await prisma.marketStand.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        locationName: true,
        locationGuide: true,
        latitude: true,
        longitude: true,
        images: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching market stands:', error);
    return [];
  }
}

export default async function MarketStandDashboard() {
  const user = await getUser();
  
  // If no user, redirect to home page
  if (!user) {
    redirect('/');
  }

  // Only fetch market stands if we have a user
  const marketStands = await getMarketStands(user.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Market Stands</h1>
          <p className="text-muted-foreground">
            Manage your market stands and their products
          </p>
        </div>
        <Link href="/market-stand/setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Market Stand
          </Button>
        </Link>
      </div>

      {marketStands.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No market stands yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first market stand to start selling products
          </p>
          <Link href="/market-stand/setup">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Market Stand
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {marketStands.map((stand) => (
            <MarketStandCard 
              key={stand.id}
              stand={stand}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}