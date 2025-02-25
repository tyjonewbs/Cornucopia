'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import db from "@/lib/db";
import { logError } from "@/lib/logger";

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

    return stands;
  } catch (error) {
    // Log detailed error information
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logError('Prisma known request error:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
    } else {
      logError('Unknown error fetching user market stands:', error);
    }
    
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

    return stands;
  } catch (error) {
    // Log detailed error information
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logError('Prisma known request error:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      logError('Prisma initialization error:', {
        message: error.message,
        clientVersion: error.clientVersion
      });
    } else {
      logError('Unknown error fetching market stands:', error);
    }
    
    // Re-throw specific errors that should be handled by the UI
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error('Database connection error. Please try again later.');
    }
    
    // For other errors, return empty array as fallback
    return [];
  }
});
