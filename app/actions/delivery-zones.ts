'use server';

import { getSupabaseServer } from "@/lib/supabase-server";
import { createDeliveryZoneSchema, updateDeliveryZoneSchema } from "@/lib/validators/deliverySchemas";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";

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

    // Update delivery zone
    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: validated,
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

    // Check if zone is being used by any products
    const productsCount = await prisma.product.count({
      where: { deliveryZoneId: id },
    });

    if (productsCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete zone. It is being used by ${productsCount} product(s).` 
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
