import { z } from "zod";
import { Status } from "@prisma/client";

// Product creation schema
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  inventory: z.number().int().min(0, "Inventory cannot be negative"),
  inventoryUpdatedAt: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(Status).default(Status.PENDING),
  isActive: z.boolean().default(true),
  userId: z.string().uuid("Invalid user ID"),
  
  // Market stand is now optional (for delivery-only products)
  marketStandId: z.string().uuid("Invalid market stand ID").nullable().optional(),
  
  // Delivery fields
  deliveryAvailable: z.boolean().optional(),
  deliveryZoneId: z.string().uuid("Invalid delivery zone ID").nullable().optional(),
  
  // Availability date fields
  availableDate: z.string().datetime().nullable().optional(),
  availableUntil: z.string().datetime().nullable().optional(),
  
  tags: z.array(z.string()).default([]),
}).refine(
  (data) => {
    // If delivery is available, delivery zone must be specified
    if (data.deliveryAvailable && !data.deliveryZoneId) {
      return false;
    }
    return true;
  },
  {
    message: "Delivery zone is required when delivery is available",
    path: ["deliveryZoneId"],
  }
).refine(
  (data) => {
    // If availableUntil is set, it must be after availableDate
    if (data.availableDate && data.availableUntil) {
      const start = new Date(data.availableDate);
      const end = new Date(data.availableUntil);
      return end > start;
    }
    return true;
  },
  {
    message: "Available until date must be after available date",
    path: ["availableUntil"],
  }
);

// Product update schema - all fields optional except validation rules
export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  images: z.array(z.string().url()).min(1).optional(),
  inventory: z.number().int().min(0).optional(),
  inventoryUpdatedAt: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(Status).optional(),
  isActive: z.boolean().optional(),
  marketStandId: z.string().uuid("Invalid market stand ID").nullable().optional(),
  deliveryAvailable: z.boolean().optional(),
  deliveryZoneId: z.string().uuid("Invalid delivery zone ID").nullable().optional(),
  availableDate: z.string().datetime().nullable().optional(),
  availableUntil: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // If availableUntil is being updated with availableDate, validate ordering
    if (data.availableDate && data.availableUntil) {
      const start = new Date(data.availableDate);
      const end = new Date(data.availableUntil);
      return end > start;
    }
    return true;
  },
  {
    message: "Available until date must be after available date",
    path: ["availableUntil"],
  }
);

// Product query schema
export const getProductsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  marketStandId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Product ID schema
export const productIdSchema = z.string().uuid("Invalid product ID");

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
