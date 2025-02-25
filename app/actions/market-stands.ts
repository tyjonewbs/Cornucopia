'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import db from "@/lib/db";
import { handleDatabaseError } from "@/lib/error-handler";
import { serializeMarketStands } from "@/lib/serializers";

export interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  createdAt: Date;
  tags: string[];
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  user: {
    firstName: string;
    profileImage: string;
  };
  _count?: {
    products: number;
  };
  lastProductUpdate?: Date | null;
}

export const getUserMarketStands = cache(async (userId: string): Promise<MarketStand[]> => {
  try {
    const stands = await db.marketStand.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        products: true,
        user: {
          select: {
            firstName: true,
            profileImage: true
          }
        },
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

    // Use the serializer to convert Prisma models to plain objects
    return serializeMarketStands(stands);
  } catch (error) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch user market stands", {
      userId
    });
    
    console.error('Error fetching user market stands:', errorData);
    
    // Return empty array as fallback
    return [];
  }
});

export const getMarketStands = cache(async (): Promise<MarketStand[]> => {
  try {
    const stands = await db.marketStand.findMany({
      where: {
        isActive: true
      },
      include: {
        products: true,
        user: {
          select: {
            firstName: true,
            profileImage: true
          }
        }
      }
    });

    // Use the serializer to convert Prisma models to plain objects
    return serializeMarketStands(stands);
  } catch (error) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch market stands");
    
    console.error('Error fetching market stands:', errorData);
    
    // Re-throw database connection errors that should be handled by the UI
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error('Database connection error. Please try again later.');
    }
    
    // For other errors, return empty array as fallback
    return [];
  }
});
