import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Market stand by ID API route called:', params.id);
  
  try {
    // Ensure connection is established
    await prisma.$connect();
    
    console.log('Fetching market stand...');
    const marketStand = await prisma.marketStand.findUnique({
      where: {
        id: params.id
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            images: true,
            inventory: true,
            inventoryUpdatedAt: true,
            status: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            tags: true,
            averageRating: true,
            totalReviews: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    // Explicitly disconnect after query
    await prisma.$disconnect();

    if (!marketStand) {
      console.error('Market stand not found:', params.id);
      return NextResponse.json(
        { error: 'Market stand not found' },
        { status: 404 }
      );
    }

    console.log('Successfully fetched market stand:', marketStand.id);
    
    // Serialize dates to ISO strings before sending response
    const serializedStand = {
      ...marketStand,
      createdAt: marketStand.createdAt.toISOString(),
      products: marketStand.products.map(product => ({
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      }))
    };
    
    return NextResponse.json(JSON.parse(JSON.stringify(serializedStand)));
  } catch (error) {
    // Ensure disconnection even on error
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }

    console.error('Failed to fetch market stand:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch market stand. Please try again.' },
      { status: 500 }
    );
  }
}
