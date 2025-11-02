"use server";

import { productService } from "@/lib/services/productService";
import { ProductWithMarketStandDTO, ProductWithListingsDTO, serializeProductWithListings } from "@/lib/dto/product.dto";
import { Status } from "@prisma/client";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";

// Re-export the DTO type for backwards compatibility
export type ProductResponse = ProductWithMarketStandDTO;

interface GetProductsParams {
  userId?: string;
  marketStandId?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}

/**
 * Get products with filtering
 * Uses the product service layer for business logic
 */
export async function getProducts(params: GetProductsParams): Promise<ProductResponse[]> {
  return await productService.getProducts({
    ...params,
    limit: params.limit ?? 50,
    isActive: params.isActive ?? true,
  });
}

/**
 * Get a single product by ID
 * Uses the product service layer for business logic
 */
export async function getProduct(id: string): Promise<ProductResponse | null> {
  return await productService.getProductById(id);
}

type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt?: string | null;
  status: Status;
  isActive: boolean;
  userId: string;
  
  // Now optional for delivery-only products
  marketStandId?: string | null;
  
  // Delivery fields
  deliveryAvailable?: boolean;
  deliveryZoneId?: string | null;
  
  // Flag for products without fulfillment (needs setup later)
  needsFulfillment?: boolean;
  
  // Availability date fields
  availableDate?: string | null;
  availableUntil?: string | null;
  
  tags: string[];
};

/**
 * Create a new product
 * Uses the product service layer for business logic and validation
 */
export async function createProduct(data: CreateProductInput): Promise<ProductResponse> {
  return await productService.createProduct(data);
}

type UpdateProductInput = Partial<Omit<CreateProductInput, 'userId'>>;

/**
 * Update an existing product
 * Uses the product service layer for business logic and validation
 */
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ProductResponse> {
  return await productService.updateProduct(id, data);
}

/**
 * Delete a product
 * Uses the product service layer for business logic
 */
export async function deleteProduct(id: string): Promise<void> {
  return await productService.deleteProduct(id);
}

/**
 * Get products with their stand listings for dashboard
 * Used by the products dashboard to show cross-listing information
 */
export async function getProductsWithListings(): Promise<ProductWithListingsDTO[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const products = await prisma.product.findMany({
    where: { 
      userId: user.id,
    },
    include: {
      standListings: {
        where: { isActive: true },
        include: {
          marketStand: {
            select: {
              id: true,
              name: true,
              locationName: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      deliveryListings: {
        include: {
          deliveryZone: {
            select: {
              id: true,
              name: true,
              deliveryFee: true,
              deliveryDays: true,
            }
          }
        },
        orderBy: { dayOfWeek: 'asc' }
      },
      deliveryZone: {
        select: {
          id: true,
          name: true,
          deliveryFee: true,
          freeDeliveryThreshold: true,
          minimumOrder: true,
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return products.map(serializeProductWithListings);
}

/**
 * Update delivery listing inventory
 */
export async function updateDeliveryListingInventory(
  listingId: string,
  inventory: number
): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership through product
  const listing = await prisma.productDeliveryListing.findUnique({
    where: { id: listingId },
    include: {
      product: { select: { userId: true } }
    }
  });

  if (!listing || listing.product.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.productDeliveryListing.update({
    where: { id: listingId },
    data: { inventory }
  });
}

/**
 * Get delivery order counts grouped by day and zone
 * Returns counts for pending, confirmed, and ready orders
 */
export async function getDeliveryOrderCounts(userId: string): Promise<Record<string, Record<string, number>>> {
  // Get all delivery zones for this user
  const deliveryZones = await prisma.deliveryZone.findMany({
    where: { userId, isActive: true },
    select: { id: true }
  });

  const zoneIds = deliveryZones.map(z => z.id);

  if (zoneIds.length === 0) {
    return {};
  }

  // Get all delivery orders (pending, confirmed, ready)
  const orders = await prisma.order.findMany({
    where: {
      deliveryZoneId: { in: zoneIds },
      status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
      deliveryDate: { not: null }
    },
    select: {
      deliveryZoneId: true,
      deliveryDate: true
    }
  });

  // Group by day of week and zone
  const counts: Record<string, Record<string, number>> = {};
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  orders.forEach(order => {
    if (!order.deliveryDate || !order.deliveryZoneId) return;

    const dayOfWeek = DAYS[order.deliveryDate.getDay()];
    
    if (!counts[dayOfWeek]) {
      counts[dayOfWeek] = {};
    }
    
    if (!counts[dayOfWeek][order.deliveryZoneId]) {
      counts[dayOfWeek][order.deliveryZoneId] = 0;
    }
    
    counts[dayOfWeek][order.deliveryZoneId]++;
  });

  return counts;
}
