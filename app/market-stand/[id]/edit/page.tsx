import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "../../../../lib/db";
import { getUser } from "@/lib/auth";
import { Card } from "../../../../components/ui/card";
import { MarketStandForm } from "../../../../components/form/MarketStandForm";

async function getData(encodedId: string) {
  try {
    const id = decodeURIComponent(encodedId);

    const marketStand = await prisma.marketStand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        locationName: true,
        locationGuide: true,
        latitude: true,
        longitude: true,
        tags: true,
        userId: true
      }
    });

    if (!marketStand) {
      return null;
    }

    // Ensure data is serializable
    return {
      id: marketStand.id,
      name: marketStand.name,
      description: marketStand.description || '',
      images: marketStand.images,
      locationName: marketStand.locationName,
      locationGuide: marketStand.locationGuide,
      latitude: marketStand.latitude,
      longitude: marketStand.longitude,  
      tags: marketStand.tags || [],
      userId: marketStand.userId
    };
  } catch (error) {
    console.error('getData error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      encodedId,
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

export default async function EditMarketStandPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  
  // Debug params
  console.log('EditMarketStandPage params:', {
    rawParams: params,
    id: params.id,
  });

  // Authentication check
  const user = await getUser();

  console.log('Authentication check:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email
  });

  if (!user) {
    console.log('No authenticated user, redirecting to home');
    return redirect("/");
  }

  // Fetch market stand data
  console.log('Fetching market stand data...');
  const marketStand = await getData(params.id);

  // Debug ownership check
  console.log('Ownership verification:', {
    marketStandFound: !!marketStand,
    marketStandId: marketStand?.id,
    marketStandUserId: marketStand?.userId,
    currentUserId: user.id,
    isOwner: marketStand?.userId === user.id
  });

  if (!marketStand) {
    console.log('Market stand not found');
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-center">Market Stand not found</h1>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          Debug Info:
          {JSON.stringify({
            params,
            userId: user.id,
            timestamp: new Date().toISOString()
          }, null, 2)}
        </pre>
      </div>
    );
  }

  // Verify ownership
  if (!marketStand || marketStand.userId !== user.id) {
    console.log('User is not owner, redirecting to view page');
    return redirect(`/market-stand/${params.id}`); // Use original ID for consistency
  }

  console.log('Access verified, preparing form data');

  // Format market stand data for the form
  const formattedMarketStand = {
    ...marketStand,
    description: marketStand.description
  };

  console.log('Rendering edit form with data:', {
    id: formattedMarketStand.id,
    name: formattedMarketStand.name,
    hasDescription: !!formattedMarketStand.description,
    imageCount: formattedMarketStand.images.length,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Market Stand</h1>
        <p className="text-muted-foreground">Update your market stand details</p>
      </div>
      <Card>
        <MarketStandForm 
          userId={user.id} 
          marketStand={formattedMarketStand} 
        />
      </Card>
    </div>
  );
}
