import { Card } from "@/components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { WeeklyHours } from "@/types/hours";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { MarketStandCard } from "@/components/MarketStandCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function MarketStandSetupPage() {
  noStore();
  
  try {
    const user = await getUser();

    if (!user) {
      redirect('/');
    }

    // Get all market stands for the user
    const userStands = await prisma.marketStand.findMany({
      where: { 
        userId: user.id.toString(),
        isActive: true
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Market Stands</h1>
            <p className="text-muted-foreground">
              Manage your market stands or create a new one
            </p>
          </div>
          <Link href="/dashboard/market-stand/setup/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Market Stand
            </Button>
          </Link>
        </div>

        {userStands.length === 0 ? (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No market stands yet</AlertTitle>
            <AlertDescription>
              You haven't created any market stands yet. Click the "Create New Market Stand" button to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6 mb-8">
            {userStands.map((stand) => (
              <MarketStandCard key={stand.id} stand={stand} />
            ))}
          </div>
        )}

        {userStands.length > 0 && (
          <div className="text-sm text-muted-foreground mt-8">
            <p>Need to make changes to your products?</p>
            <p>Visit the <Link href="/dashboard/market-stand" className="text-primary hover:underline">Market Stand Dashboard</Link> to manage your inventory.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error in MarketStandSetupPage:", error);
    
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Error Loading Market Stands</h1>
          <p className="text-muted-foreground">
            There was an error loading your market stands. Please try again later.
          </p>
        </div>
        <div className="flex justify-center mt-8">
          <Link href="/dashboard">
            <Button>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}
