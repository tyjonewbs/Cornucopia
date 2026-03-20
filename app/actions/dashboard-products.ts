'use server';

import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Helper to calculate time ago
 */
function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * Get products for a stand with inventory + sold count
 */
export async function getStandProducts(standId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns this stand
    const stand = await prisma.marketStand.findFirst({
      where: { id: standId, userId: user.id }
    });

    if (!stand) {
      return { success: false, error: "Stand not found or access denied" };
    }

    // Get product listings for this stand
    const listings = await prisma.productStandListing.findMany({
      where: {
        marketStandId: standId,
        isActive: true
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            status: true,
            inventory: true,
            isActive: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calculate sold count for each product
    const productsWithSold = await Promise.all(
      listings.map(async (listing) => {
        const soldResult = await prisma.orderItem.aggregate({
          _sum: { quantity: true },
          where: {
            productId: listing.product.id,
            order: {
              marketStandId: standId,
              status: { in: ['COMPLETED', 'DELIVERED'] }
            }
          }
        });

        return {
          listingId: listing.id,
          productId: listing.product.id,
          name: listing.product.name,
          price: listing.customPrice ?? listing.product.price,
          images: listing.product.images,
          status: listing.product.status,
          isActive: listing.product.isActive,
          inventory: listing.customInventory ?? listing.product.inventory,
          sold: soldResult._sum.quantity || 0,
          updatedAt: listing.updatedAt,
          timeAgo: timeAgo(listing.updatedAt)
        };
      })
    );

    return { success: true, products: productsWithSold };
  } catch (error) {
    console.error("Error fetching stand products:", error);
    return { success: false, error: "Error fetching products" };
  }
}

/**
 * Get products for a delivery zone with inventory + sold count
 * Returns one entry per product (summed/averaged across delivery days)
 */
export async function getDeliveryZoneProducts(zoneId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns this zone
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id }
    });

    if (!zone) {
      return { success: false, error: "Zone not found or access denied" };
    }

    // Get all delivery listings for this zone
    const listings = await prisma.productDeliveryListing.findMany({
      where: {
        deliveryZoneId: zoneId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            status: true,
            isActive: true
          }
        }
      },
      orderBy: {
        product: { name: 'asc' }
      }
    });

    // Group by product and sum/average inventory
    const productMap = new Map();
    for (const listing of listings) {
      const productId = listing.product.id;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          name: listing.product.name,
          price: listing.product.price,
          images: listing.product.images,
          status: listing.product.status,
          isActive: listing.product.isActive,
          inventorySum: 0,
          count: 0,
          updatedAt: listing.updatedAt
        });
      }
      const entry = productMap.get(productId);
      entry.inventorySum += listing.inventory;
      entry.count += 1;
      if (listing.updatedAt > entry.updatedAt) {
        entry.updatedAt = listing.updatedAt;
      }
    }

    // Calculate sold count and format results
    const productsWithSold = await Promise.all(
      Array.from(productMap.values()).map(async (entry) => {
        const soldResult = await prisma.orderItem.aggregate({
          _sum: { quantity: true },
          where: {
            productId: entry.productId,
            order: {
              deliveryZoneId: zoneId,
              status: { in: ['COMPLETED', 'DELIVERED'] }
            }
          }
        });

        return {
          productId: entry.productId,
          name: entry.name,
          price: entry.price,
          images: entry.images,
          status: entry.status,
          isActive: entry.isActive,
          inventory: Math.round(entry.inventorySum / entry.count), // Average inventory across days
          sold: soldResult._sum.quantity || 0,
          updatedAt: entry.updatedAt,
          timeAgo: timeAgo(entry.updatedAt)
        };
      })
    );

    return { success: true, products: productsWithSold };
  } catch (error) {
    console.error("Error fetching delivery zone products:", error);
    return { success: false, error: "Error fetching products" };
  }
}

/**
 * Update stand product inventory (writes to ProductStandListing.customInventory)
 */
export async function updateStandProductInventory(listingId: string, newInventory: number) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership via stand.userId
    const listing = await prisma.productStandListing.findUnique({
      where: { id: listingId },
      include: {
        marketStand: { select: { userId: true } },
        product: { select: { id: true } }
      }
    });

    if (!listing || listing.marketStand.userId !== user.id) {
      return { success: false, error: "Listing not found or access denied" };
    }

    // Update listing inventory
    await prisma.productStandListing.update({
      where: { id: listingId },
      data: { customInventory: newInventory }
    });

    // Also update Product.inventory as fallback
    await prisma.product.update({
      where: { id: listing.product.id },
      data: { inventory: newInventory }
    });

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error("Error updating stand product inventory:", error);
    return { success: false, error: "Error updating inventory" };
  }
}

/**
 * Update delivery zone product inventory (writes to ALL ProductDeliveryListing for this product+zone)
 */
export async function updateDeliveryProductInventory(productId: string, zoneId: string, newInventory: number) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id }
    });

    if (!zone) {
      return { success: false, error: "Zone not found or access denied" };
    }

    // Update ALL ProductDeliveryListing.inventory where productId+deliveryZoneId match
    await prisma.productDeliveryListing.updateMany({
      where: {
        productId,
        deliveryZoneId: zoneId
      },
      data: { inventory: newInventory }
    });

    // Also update Product.inventory
    await prisma.product.update({
      where: { id: productId },
      data: { inventory: newInventory }
    });

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error("Error updating delivery product inventory:", error);
    return { success: false, error: "Error updating inventory" };
  }
}

/**
 * Add existing product to stand
 */
export async function addProductToStand(productId: string, standId: string, initialInventory: number) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify stand ownership
    const stand = await prisma.marketStand.findFirst({
      where: { id: standId, userId: user.id }
    });

    if (!stand) {
      return { success: false, error: "Stand not found or access denied" };
    }

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: user.id }
    });

    if (!product) {
      return { success: false, error: "Product not found or access denied" };
    }

    // Check if listing already exists
    const existingListing = await prisma.productStandListing.findFirst({
      where: {
        productId,
        marketStandId: standId
      }
    });

    if (existingListing) {
      return { success: false, error: "Product already added to this stand" };
    }

    // Create ProductStandListing record
    await prisma.productStandListing.create({
      data: {
        productId,
        marketStandId: standId,
        isActive: true,
        customInventory: initialInventory,
        status: 'APPROVED'
      }
    });

    // Set Product.marketStandId if not already set (for geo search)
    if (!product.marketStandId) {
      await prisma.product.update({
        where: { id: productId },
        data: { marketStandId: standId }
      });
    }

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error("Error adding product to stand:", error);
    return { success: false, error: "Error adding product" };
  }
}

/**
 * Add existing product to delivery zone
 */
export async function addProductToDeliveryZone(productId: string, zoneId: string, initialInventory: number) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify zone ownership
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id },
      select: { deliveryDays: true }
    });

    if (!zone) {
      return { success: false, error: "Zone not found or access denied" };
    }

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: user.id }
    });

    if (!product) {
      return { success: false, error: "Product not found or access denied" };
    }

    // Create ProductDeliveryListing for each delivery day
    if (zone.deliveryDays && zone.deliveryDays.length > 0) {
      await prisma.productDeliveryListing.createMany({
        data: zone.deliveryDays.map(day => ({
          productId,
          deliveryZoneId: zoneId,
          dayOfWeek: day,
          inventory: initialInventory
        })),
        skipDuplicates: true
      });
    }

    // Set product as delivery-available and link to zone
    await prisma.product.update({
      where: { id: productId },
      data: {
        deliveryAvailable: true,
        deliveryZoneId: zoneId
      }
    });

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error("Error adding product to delivery zone:", error);
    return { success: false, error: "Error adding product" };
  }
}

/**
 * Get user's products NOT yet in this stand/zone (for the add picker)
 */
export async function getAvailableProducts(userId: string, contextId: string, mode: 'stand' | 'delivery') {
  try {
    const user = await getUser();
    if (!user || user.id !== userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Get all user's active products
    const allProducts = await prisma.product.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        inventory: true
      },
      orderBy: { name: 'asc' }
    });

    if (mode === 'stand') {
      // Get products already in this stand
      const existingListings = await prisma.productStandListing.findMany({
        where: { marketStandId: contextId },
        select: { productId: true }
      });

      const existingIds = new Set(existingListings.map(l => l.productId));
      const availableProducts = allProducts.filter(p => !existingIds.has(p.id));

      return { success: true, products: availableProducts };
    } else {
      // Get products already in this delivery zone
      const existingListings = await prisma.productDeliveryListing.findMany({
        where: { deliveryZoneId: contextId },
        select: { productId: true }
      });

      const existingIds = new Set(existingListings.map(l => l.productId));
      const availableProducts = allProducts.filter(p => !existingIds.has(p.id));

      return { success: true, products: availableProducts };
    }
  } catch (error) {
    console.error("Error fetching available products:", error);
    return { success: false, error: "Error fetching products" };
  }
}
