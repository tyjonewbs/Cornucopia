"use server";

import prisma, { executeWithRetry } from "@/lib/db";
import { getProducts, type ProductResponse } from "./products";
import { handleDatabaseError } from "@/lib/error-handler";
import { serializeProducts } from "@/lib/serializers";
import { 
  calculateProductBadge, 
  isMarketStandOpen,
  type ProductBadge 
} from "@/lib/utils/product-badges";

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
  availableAt: Array<{
    id: string;
    name: string;
    distance: number | null;
    locationName: string;
  }>;
  deliveryInfo: {
    isAvailable: boolean;
    deliveryFee: number | null;
    zoneName: string | null;
    zoneId: string | null;
    minimumOrder: number | null;
    freeDeliveryThreshold: number | null;
    deliveryDays?: string[];
  } | null;
  badge: ProductBadge | null;
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
    
    // Add distance, delivery info, and badge calculation
    return serializedProducts.map(product => {
      // Check if market stand is currently open
      const marketStandHours = (product as any).marketStand?.hours;
      const isOpen = marketStandHours ? isMarketStandOpen(marketStandHours) : false;
      
      // Calculate smart badge
      const totalInventory = product.inventory || 0;
      const badge = calculateProductBadge({
        availableDate: product.availableDate,
        availableUntil: product.availableUntil,
        totalInventory,
        inventoryUpdatedAt: (product as any).inventoryUpdatedAt || product.updatedAt,
        updatedAt: product.updatedAt,
        hasMarketStand: true, // Local products always have market stands
        hasDelivery: product.deliveryAvailable,
        isMarketStandOpen: isOpen || undefined,
      });
      
      return {
        ...product,
        distance: null, // Local products don't need distance calculation
        availableAt: [{
          id: product.marketStand.id,
          name: product.marketStand.name,
          distance: null,
          locationName: product.marketStand.locationName
        }],
        deliveryInfo: null, // No delivery info for local products for now
        badge,
      };
    }) as SerializedProduct[];
  } catch (error) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch local products", {
      localId
    });
    
    console.error('Error fetching local products:', errorData);
    return [];
  }
}
