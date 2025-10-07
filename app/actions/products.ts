"use server";

import { productService } from "@/lib/services/productService";
import { ProductWithMarketStandDTO } from "@/lib/dto/product.dto";
import { Status } from "@prisma/client";

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
  marketStandId: string;
  tags: string[];
};

/**
 * Create a new product
 * Uses the product service layer for business logic and validation
 */
export async function createProduct(data: CreateProductInput): Promise<ProductResponse> {
  return await productService.createProduct(data);
}

type UpdateProductInput = Partial<Omit<CreateProductInput, 'userId' | 'marketStandId'>>;

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
