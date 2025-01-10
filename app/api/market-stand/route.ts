import { NextResponse } from "next/server";
import prisma from "../../../lib/db";
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
    // First verify database connection and check for existing market stands
    try {
      const result = await prisma.$transaction([
        prisma.$queryRaw`SELECT COUNT(*) FROM "MarketStand"`,
        prisma.marketStand.findMany({
          take: 1,
          select: { id: true }
        })
      ]);
      
      console.log('Database connection verified:', {
        rawCount: result[0],
        sampleStand: result[1]
      });
    } catch (error) {
      console.error('Database check failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 500 }
      );
    }

    // Then fetch market stands with detailed error handling
    try {
      console.log('Fetching market stands...');
      const marketStands = await prisma.marketStand.findMany({
        take: 10, // Limit to 10 stands for now to reduce load
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

      if (!marketStands || !Array.isArray(marketStands)) {
        console.error('Invalid market stands response:', marketStands);
        throw new Error('Invalid response from database');
      }

      // Log each market stand for debugging
      marketStands.forEach((stand, index) => {
        console.log(`Market stand ${index + 1}:`, {
          id: stand.id,
          name: stand.name,
          hasImages: Array.isArray(stand.images) && stand.images.length > 0,
          imageUrls: stand.images,
          productCount: stand.products.length
        });
      });

      console.log('Successfully fetched market stands:', {
        count: marketStands.length,
        hasData: marketStands.length > 0
      });
      
      return NextResponse.json(marketStands);
    } catch (error) {
      console.error('Failed to fetch market stands:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return NextResponse.json(
        { error: 'Failed to fetch market stands. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to fetch market stands:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Try to connect to database to check connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      // If we get here, database is connected
      return NextResponse.json(
        { error: 'Failed to fetch market stands. Database is connected but query failed.' },
        { status: 500 }
      );
    } catch (dbError) {
      // Database connection failed
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Failed to connect to database. Please try again later.' },
        { status: 500 }
      );
    }
  }
}
