import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

type MarketStandWithRelations = Prisma.MarketStandGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    images: true;
    latitude: true;
    longitude: true;
    locationName: true;
    locationGuide: true;
    createdAt: true;
    tags: true;
    products: {
      select: {
        id: true;
        name: true;
        description: true;
        price: true;
        images: true;
        createdAt: true;
        updatedAt: true;
      };
    };
    user: {
      select: {
        firstName: true;
        profileImage: true;
      };
    };
  };
}>;

export async function GET() {
  console.log('Market stand API route called');
  
  try {
    // Ensure connection is established
    await prisma.$connect();
    
    console.log('Fetching market stands...');
    const marketStands = await prisma.marketStand.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        latitude: true,
        longitude: true,
        locationName: true,
        locationGuide: true,
        createdAt: true,
        tags: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            images: true,
            createdAt: true,
            updatedAt: true
          }
        },
        user: {
          select: {
            firstName: true,
            profileImage: true
          }
        }
      }
    });

    // Explicitly disconnect after query
    await prisma.$disconnect();

    if (!marketStands || !Array.isArray(marketStands)) {
      console.error('Invalid market stands response:', marketStands);
      throw new Error('Invalid response from database');
    }

    console.log('Successfully fetched market stands:', {
      count: marketStands.length,
      hasData: marketStands.length > 0
    });
    
    // Serialize dates to ISO strings before sending response
    // Double serialize to handle any non-serializable objects
    const serializedStands = marketStands.map(stand => ({
      ...stand,
      createdAt: stand.createdAt.toISOString(),
      products: stand.products.map(product => ({
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      }))
    }));
    
    return NextResponse.json(JSON.parse(JSON.stringify(serializedStands)));
  } catch (error) {
    // Ensure disconnection even on error
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    console.error('Failed to fetch market stands:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch market stands. Please try again.' },
      { status: 500 }
    );
  }
}
