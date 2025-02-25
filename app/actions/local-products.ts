"use server";

import prisma, { executeWithRetry } from "lib/db";
import { getProducts, type ProductResponse } from "./products";

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

    return products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images,
      inventory: product.inventory,
      inventoryUpdatedAt: product.inventoryUpdatedAt?.toISOString() || null,
      status: product.status,
      isActive: product.isActive,
      userId: product.userId,
      marketStandId: product.marketStandId,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      totalReviews: product.totalReviews,
      averageRating: product.averageRating,
      tags: product.tags,
      distance: null, // Local products don't need distance calculation
      marketStand: {
        id: product.marketStand.id,
        name: product.marketStand.name,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude,
        locationName: product.marketStand.locationName,
        user: {
          firstName: product.marketStand.user.firstName,
          profileImage: product.marketStand.user.profileImage
        }
      },
      locationName: product.marketStand.locationName
    }));
  } catch (error) {
    console.error('Failed to fetch local products:', error);
    return [];
  }
}
