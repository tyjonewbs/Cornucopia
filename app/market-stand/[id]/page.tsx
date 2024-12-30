import prisma from "../../../lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { MapPin, Package, Edit } from "lucide-react";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ProductCard } from "../../../components/ProductCard";

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

    const marketStand = await prisma.marketStand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        locationName: true,
        locationGuide: true,
        userId: true,
        products: {
          select: {
            id: true,
            name: true,
            images: true,
            updatedAt: true,
            price: true,
            inventory: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
          }
        }
      }
    });

    console.log('Prisma query result:', {
      found: !!marketStand,
      marketStandId: marketStand?.id,
      userId: marketStand?.userId,
      productCount: marketStand?.products.length
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

export default async function MarketStandPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  
  // Debug params
  console.log('MarketStandPage params:', {
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

  // Fetch market stand data
  console.log('Fetching market stand data...');
  const marketStand = await getData(params.id);

  // Debug ownership check
  console.log('Ownership verification:', {
    marketStandFound: !!marketStand,
    marketStandId: marketStand?.id,
    marketStandUserId: marketStand?.userId,
    currentUserId: user?.id,
    isOwner: user?.id === marketStand?.userId,
    editUrl: marketStand ? `/market-stand/edit/${params.id}` : null // Updated edit URL path
  });

  if (!marketStand) {
    console.log('Market stand not found');
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-2xl font-bold text-center">Market Stand not found</h1>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          Debug Info:
          {JSON.stringify({
            params,
            userId: user?.id,
            timestamp: new Date().toISOString()
          }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Market Stand Info */}
        <div>
          <div className="aspect-w-16 aspect-h-9 relative rounded-lg overflow-hidden">
            <Image
              src={marketStand.images[0]}
              alt={marketStand.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={marketStand.user.profileImage}
                alt={marketStand.user.firstName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{marketStand.name}</h2>
                <p className="text-muted-foreground">
                  {marketStand.user.firstName}&apos;s Stand
                </p>
              </div>
              {user?.id === marketStand.userId && (
                <Link href={`/market-stand/edit/${params.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 w-full">
                    <Edit className="h-4 w-4" />
                    Edit Stand
                  </Button>
                </Link>
              )}
            </div>
            {marketStand.description && (
              <p className="text-muted-foreground mb-4">{marketStand.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <div>
                  <p className="font-medium">{marketStand.locationName}</p>
                  <p className="text-xs">{marketStand.locationGuide}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{marketStand.products.length} products</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Available Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {marketStand.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                images={product.images}
                locationName={marketStand.locationName}
                updatedAt={product.updatedAt}
                inventory={product.inventory}
                marketStandId={marketStand.id}
                isQRAccess={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
