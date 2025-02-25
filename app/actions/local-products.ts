"use server";

import prisma, { executeWithRetry } from "@/lib/db";
import { getProducts, type ProductResponse } from "./products";
import { handleDatabaseError } from "@/lib/error-handler";
import { serializeProducts } from "@/lib/serializers";

export interface SerializedProduct extends ProductResponse {
  distance: number | null;
  marketStand: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    locationName: string;
    user: {
      firstName: string;
      profileImage: string;
    };
  };
}

export async function getLocalProducts(localId: string): Promise<SerializedProduct[]> {
  try {
    const products = await executeWithRetry(() => prisma.product.findMany({
      where: {
        localId,
        isActive: true,
        status: 'APPROVED',
        inventory: {
          gt: 0
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
            user: {
              select: {
                firstName: true,
                profileImage: true
              }
            }
          }
        }
      }
    }));

    // Use the serializer to convert Prisma models to plain objects
    const serializedProducts = serializeProducts(products);
    
    // Add distance property (null for local products)
    return serializedProducts.map(product => ({
      ...product,
      distance: null // Local products don't need distance calculation
    })) as SerializedProduct[];
  } catch (error) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch local products", {
      localId
    });
    
    console.error('Error fetching local products:', errorData);
    return [];
  }
}
