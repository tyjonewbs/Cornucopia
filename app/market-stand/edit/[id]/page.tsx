import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "../../../../lib/db";
import { Card } from "../../../../components/ui/card";
import { MarketStandForm } from "../../../../components/form/MarketStandForm";

async function getData(encodedId: string) {
  try {
    // Handle ID decoding once at the start
    const id = decodeURIComponent(encodedId);
    console.log('getData debug:', {
      encodedId,
      decodedId: id,
      isEncoded: encodedId !== id
    });

    // Verify database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection verified');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      throw new Error('Database connection failed');
    }

    // First try raw query to debug any ID issues
    try {
      const rawCheck = await prisma.$queryRaw`
        SELECT id, "userId" 
        FROM "MarketStand" 
        WHERE id = ${id}
      `;
      console.log('Raw market stand check:', rawCheck);
    } catch (rawError) {
      console.error('Raw query error:', rawError);
    }

    // Fetch market stand with Prisma
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
        userId: true
      }
    });

    console.log('Prisma query result:', {
      found: !!marketStand,
      marketStandId: marketStand?.id,
      userId: marketStand?.userId,
      query: {
        where: { id },
        select: ['id', 'name', 'description', 'images', 'locationName', 'locationGuide', 'latitude', 'longitude', 'userId']
      }
    });

    return marketStand;
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
  const { getUser } = getKindeServerSession();
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
  if (marketStand.userId !== user.id) {
    console.log('User is not owner, redirecting to view page');
    return redirect(`/market-stand/${params.id}`); // Use original ID for consistency
  }

  console.log('Access verified, preparing form data');

  // Format market stand data for the form
  const formattedMarketStand = {
    ...marketStand,
    description: marketStand.description || undefined
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
