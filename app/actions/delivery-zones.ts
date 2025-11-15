'use server';

import { getSupabaseServer } from "@/lib/supabase-server";
import { createDeliveryZoneSchema, updateDeliveryZoneSchema } from "@/lib/validators/deliverySchemas";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Get all delivery zones for the current user
 */
export async function getUserDeliveryZones() {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const zones = await prisma.deliveryZone.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, zones };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching delivery zones"
    };
  }
}

/**
 * Get a single delivery zone by ID
 */
export async function getDeliveryZone(id: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const zone = await prisma.deliveryZone.findFirst({
      where: { 
        id,
        userId: user.id 
      },
    });

    if (!zone) {
      return { success: false, error: "Delivery zone not found" };
    }

    return { success: true, zone };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching delivery zone"
    };
  }
}

/**
 * Create a new delivery zone
 */
export async function createDeliveryZone(formData: FormData) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Parse form data
    const description = formData.get("description") as string;
    const data = {
      name: formData.get("name") as string,
      ...(description && description.trim() ? { description: description.trim() } : {}),
      zipCodes: JSON.parse(formData.get("zipCodes") as string || "[]"),
      cities: JSON.parse(formData.get("cities") as string || "[]"),
      states: JSON.parse(formData.get("states") as string || "[]"),
      deliveryFee: parseInt(formData.get("deliveryFee") as string),
      freeDeliveryThreshold: formData.get("freeDeliveryThreshold") 
        ? parseInt(formData.get("freeDeliveryThreshold") as string)
        : null,
      minimumOrder: formData.get("minimumOrder")
        ? parseInt(formData.get("minimumOrder") as string)
        : null,
      deliveryDays: JSON.parse(formData.get("deliveryDays") as string),
      deliveryTimeWindows: formData.get("deliveryTimeWindows")
        ? JSON.parse(formData.get("deliveryTimeWindows") as string)
        : null,
      isActive: formData.get("isActive") === "true",
    };

    // Validate data
    const validated = createDeliveryZoneSchema.parse(data);

    // Create delivery zone
    const zone = await prisma.deliveryZone.create({
      data: {
        ...validated,
        deliveryTimeWindows: validated.deliveryTimeWindows || Prisma.JsonNull,
        userId: user.id,
      },
    });

    revalidatePath('/dashboard/delivery-zones');
    
    return { success: true, zone };
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return {
        success: false,
        error: "Validation error",
        issues: (error as any).issues
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating delivery zone"
    };
  }
}

/**
 * Update an existing delivery zone
 */
export async function updateDeliveryZone(id: string, formData: FormData) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if zone exists and belongs to user
    const existingZone = await prisma.deliveryZone.findFirst({
      where: { 
        id,
        userId: user.id 
      },
    });

    if (!existingZone) {
      return { success: false, error: "Delivery zone not found" };
    }

    // Parse form data
    const data: any = {};
    
    if (formData.has("name")) data.name = formData.get("name") as string;
    if (formData.has("description")) {
      const description = formData.get("description") as string;
      if (description && description.trim()) {
        data.description = description.trim();
      }
    }
    if (formData.has("zipCodes")) data.zipCodes = JSON.parse(formData.get("zipCodes") as string);
    if (formData.has("cities")) data.cities = JSON.parse(formData.get("cities") as string);
    if (formData.has("states")) data.states = JSON.parse(formData.get("states") as string);
    if (formData.has("deliveryFee")) data.deliveryFee = parseInt(formData.get("deliveryFee") as string);
    if (formData.has("freeDeliveryThreshold")) {
      data.freeDeliveryThreshold = formData.get("freeDeliveryThreshold")
        ? parseInt(formData.get("freeDeliveryThreshold") as string)
        : null;
    }
    if (formData.has("minimumOrder")) {
      data.minimumOrder = formData.get("minimumOrder")
        ? parseInt(formData.get("minimumOrder") as string)
        : null;
    }
    if (formData.has("deliveryDays")) data.deliveryDays = JSON.parse(formData.get("deliveryDays") as string);
    if (formData.has("deliveryTimeWindows")) {
      data.deliveryTimeWindows = formData.get("deliveryTimeWindows")
        ? JSON.parse(formData.get("deliveryTimeWindows") as string)
        : null;
    }
    if (formData.has("isActive")) data.isActive = formData.get("isActive") === "true";

    // Validate data
    const validated = updateDeliveryZoneSchema.parse(data);

    // Prepare update data with proper null handling for JSON fields
    const updateData: any = { ...validated };
    if (validated.deliveryTimeWindows !== undefined) {
      updateData.deliveryTimeWindows = validated.deliveryTimeWindows || Prisma.JsonNull;
    }

    // Update delivery zone
    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/dashboard/delivery-zones');
    revalidatePath(`/dashboard/delivery-zones/${id}/edit`);
    
    return { success: true, zone };
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return {
        success: false,
        error: "Validation error",
        issues: (error as any).issues
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating delivery zone"
    };
  }
}

/**
 * Delete a delivery zone
 */
export async function deleteDeliveryZone(id: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if zone exists and belongs to user
    const existingZone = await prisma.deliveryZone.findFirst({
      where: { 
        id,
        userId: user.id 
      },
    });

    if (!existingZone) {
      return { success: false, error: "Delivery zone not found" };
    }

    // Check if zone is being used by any products (deliveryZoneId field)
    const productsWithZone = await prisma.product.count({
      where: { deliveryZoneId: id },
    });

    // Check if zone has any delivery listings
    const deliveryListings = await prisma.productDeliveryListing.count({
      where: { deliveryZoneId: id },
    });

    if (productsWithZone > 0 || deliveryListings > 0) {
      const productMsg = productsWithZone > 0 ? `${productsWithZone} product(s) are linked to this zone` : '';
      const listingMsg = deliveryListings > 0 ? `${deliveryListings} delivery listing(s) exist` : '';
      const separator = productsWithZone > 0 && deliveryListings > 0 ? ' and ' : '';
      
      return { 
        success: false, 
        error: `Cannot delete zone. ${productMsg}${separator}${listingMsg}. Please remove all products from this zone first.` 
      };
    }

    // Delete the zone
    await prisma.deliveryZone.delete({
      where: { id },
    });

    revalidatePath('/dashboard/delivery-zones');
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error deleting delivery zone"
    };
  }
}

/**
 * Toggle delivery zone active status
 */
export async function toggleDeliveryZoneStatus(id: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if zone exists and belongs to user
    const existingZone = await prisma.deliveryZone.findFirst({
      where: { 
        id,
        userId: user.id 
      },
    });

    if (!existingZone) {
      return { success: false, error: "Delivery zone not found" };
    }

    // Toggle status
    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: { isActive: !existingZone.isActive },
    });

    revalidatePath('/dashboard/delivery-zones');
    
    return { success: true, zone };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error toggling delivery zone status"
    };
  }
}

/**
 * Helper: Get all future dates for a specific day of week
 */
function getFutureDatesForDayOfWeek(dayOfWeek: string, weeksAhead: number = 52): Date[] {
  const dayMap: Record<string, number> = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };
  
  const targetDay = dayMap[dayOfWeek];
  if (targetDay === undefined) return [];
  
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find the next occurrence of this day
  let current = new Date(today);
  const daysUntilTarget = (targetDay + 7 - current.getDay()) % 7;
  current.setDate(current.getDate() + daysUntilTarget);
  
  // Get dates for the next N weeks
  for (let i = 0; i < weeksAhead; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  
  return dates;
}

/**
 * Calculate reserved quantity for a product on a specific delivery day
 */
export async function calculateReservedQuantity(
  productId: string,
  deliveryZoneId: string,
  dayOfWeek: string
) {
  try {
    // Get all future dates for this day of week
    const futureDates = getFutureDatesForDayOfWeek(dayOfWeek);
    
    // Sum up quantities from all pending/confirmed orders
    const result = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        productId,
        order: {
          deliveryZoneId,
          deliveryDate: { in: futureDates },
          status: { in: ['PENDING', 'CONFIRMED', 'READY'] }
        }
      }
    });
    
    return result._sum.quantity || 0;
  } catch (error) {
    console.error('Error calculating reserved quantity:', error);
    return 0;
  }
}

/**
 * Get all products for a delivery zone, grouped by day with inventory data
 */
export async function getDeliveryZoneProducts(zoneId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify zone belongs to user
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id }
    });

    if (!zone) {
      return { success: false, error: "Delivery zone not found" };
    }

    // Get all product listings for this zone
    const listings = await prisma.productDeliveryListing.findMany({
      where: { deliveryZoneId: zoneId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            isActive: true,
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { product: { name: 'asc' } }
      ]
    });

    // Calculate reserved quantities for each listing
    const listingsWithInventory = await Promise.all(
      listings.map(async (listing) => {
        const reserved = await calculateReservedQuantity(
          listing.productId,
          listing.deliveryZoneId,
          listing.dayOfWeek
        );
        
        return {
          ...listing,
          reserved,
          remaining: Math.max(0, listing.inventory - reserved)
        };
      })
    );

    // Group by day of week
    const productsByDay: Record<string, typeof listingsWithInventory> = {};
    listingsWithInventory.forEach((listing) => {
      if (!productsByDay[listing.dayOfWeek]) {
        productsByDay[listing.dayOfWeek] = [];
      }
      productsByDay[listing.dayOfWeek].push(listing);
    });

    return { success: true, productsByDay };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching products"
    };
  }
}

/**
 * Add a product to a delivery zone (with optional recurring across all days)
 */
export async function addProductToDeliveryZone(data: {
  productId: string;
  deliveryZoneId: string;
  dayOfWeek?: string;
  isRecurring: boolean;
  initialInventory: number;
}) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { productId, deliveryZoneId, dayOfWeek, isRecurring, initialInventory } = data;

    // Verify zone belongs to user
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: deliveryZoneId, userId: user.id }
    });

    if (!zone) {
      return { success: false, error: "Delivery zone not found" };
    }

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: user.id }
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Determine which days to add the product to
    const daysToAdd = isRecurring ? zone.deliveryDays : [dayOfWeek!];

    // Create listings for each day
    const createdListings = await Promise.all(
      daysToAdd.map(async (day) => {
        // Check if listing already exists
        const existing = await prisma.productDeliveryListing.findFirst({
          where: {
            productId,
            deliveryZoneId,
            dayOfWeek: day
          }
        });

        if (existing) {
          return null; // Skip if already exists
        }

        return prisma.productDeliveryListing.create({
          data: {
            productId,
            deliveryZoneId,
            dayOfWeek: day,
            inventory: initialInventory
          }
        });
      })
    );

    const validListings = createdListings.filter(Boolean);

    revalidatePath('/dashboard/delivery-zones');
    
    return { 
      success: true, 
      message: `Product added to ${validListings.length} delivery day(s)`,
      listings: validListings
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error adding product"
    };
  }
}

/**
 * Update inventory for a product delivery listing
 */
export async function updateDeliveryListingInventory(
  listingId: string,
  newInventory: number
) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify listing belongs to user's zone
    const listing = await prisma.productDeliveryListing.findUnique({
      where: { id: listingId },
      include: {
        deliveryZone: { select: { userId: true } }
      }
    });

    if (!listing || listing.deliveryZone.userId !== user.id) {
      return { success: false, error: "Listing not found" };
    }

    // Update inventory
    const updated = await prisma.productDeliveryListing.update({
      where: { id: listingId },
      data: { inventory: newInventory }
    });

    revalidatePath('/dashboard/delivery-zones');
    
    return { success: true, listing: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating inventory"
    };
  }
}

/**
 * Remove a product from a delivery zone day
 */
export async function removeProductFromDeliveryZone(listingId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify listing belongs to user's zone
    const listing = await prisma.productDeliveryListing.findUnique({
      where: { id: listingId },
      include: {
        deliveryZone: { select: { userId: true } }
      }
    });

    if (!listing || listing.deliveryZone.userId !== user.id) {
      return { success: false, error: "Listing not found" };
    }

    // Delete the listing
    await prisma.productDeliveryListing.delete({
      where: { id: listingId }
    });

    revalidatePath('/dashboard/delivery-zones');
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error removing product"
    };
  }
}

/**
 * Get user's products that are not yet in this zone/day combination
 */
export async function getAvailableProductsForZone(
  deliveryZoneId: string,
  dayOfWeek: string
) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get all user's products
    const allProducts = await prisma.product.findMany({
      where: { 
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
      },
      orderBy: { name: 'asc' }
    });

    // Get products already in this zone/day
    const existingListings = await prisma.productDeliveryListing.findMany({
      where: {
        deliveryZoneId,
        dayOfWeek
      },
      select: { productId: true }
    });

    const existingProductIds = new Set(existingListings.map(l => l.productId));

    // Filter out products that are already in this zone/day
    const availableProducts = allProducts.filter(
      p => !existingProductIds.has(p.id)
    );

    return { success: true, products: availableProducts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching available products"
    };
  }
}
