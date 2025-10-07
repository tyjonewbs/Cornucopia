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
  marketStandId: z.string().uuid("Invalid market stand ID"),
  tags: z.array(z.string()).default([]),
});

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
  tags: z.array(z.string()).optional(),
});

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
