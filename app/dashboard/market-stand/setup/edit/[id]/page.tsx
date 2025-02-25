import { Card } from "@/components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { MarketStandForm } from "@/components/form/MarketStandForm";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { WeeklyHours } from "@/types/hours";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditMarketStandPageProps {
  params: {
    id: string;
  };
}

export default async function EditMarketStandPage({ params }: EditMarketStandPageProps) {
  noStore();
  
  try {
    const user = await getUser();

    if (!user) {
      redirect('/');
    }

    // Get the market stand
    const marketStand = await prisma.marketStand.findUnique({
      where: { 
        id: params.id,
        userId: user.id.toString() // Ensure the user owns this market stand
      }
    });

    if (!marketStand) {
      notFound();
    }

    // Transform the Prisma model to match MarketStandForm props
    const transformedStand = {
      id: marketStand.id,
      name: marketStand.name,
      description: marketStand.description || '',
      locationName: marketStand.locationName,
      locationGuide: marketStand.locationGuide,
      latitude: marketStand.latitude,
      longitude: marketStand.longitude,
      images: marketStand.images,
      tags: marketStand.tags,
      website: marketStand.website || undefined,
      socialMedia: marketStand.socialMedia || undefined,
      hours: marketStand.hours as WeeklyHours || undefined
    };

    return (
      <div>
        <div className="mb-8">
          <Link href="/dashboard/market-stand/setup">
            <Button variant="ghost" className="gap-2 pl-0 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Market Stands
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Your Market Stand</h1>
          <p className="text-muted-foreground">
            Update your market stand information to keep your customers informed.
          </p>
        </div>

        <Card className="mb-8">
          <MarketStandForm 
            userId={user.id.toString()} 
            marketStand={transformedStand}
          />
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error in EditMarketStandPage:", error);
    
    return (
      <div>
        <div className="mb-8">
          <Link href="/dashboard/market-stand/setup">
            <Button variant="ghost" className="gap-2 pl-0 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Market Stands
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Error Loading Page</h1>
          <p className="text-muted-foreground">
            There was an error loading this page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
