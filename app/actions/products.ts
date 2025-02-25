"use server";

import prisma from "@/lib/db";
import { Status } from "@prisma/client";
import { serializeProduct, serializeProducts } from "@/lib/serializers";
import { handleDatabaseError, createErrorResponse, createNotFoundResponse } from "@/lib/error-handler";

// Types for product responses
export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt: string | null;
  status: Status;
  isActive: boolean;
  userId: string;
  marketStandId: string;
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
  marketStand?: {
    id: string;
    name: string;
    locationName?: string;
    latitude: number;
    longitude: number;
  };
  tags: string[];
  locationName?: string;
}

interface GetProductsParams {
  userId?: string;
  marketStandId?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}

export async function getProducts({
  userId,
  marketStandId,
  limit = 50,
  cursor,
  isActive = true
}: GetProductsParams): Promise<ProductResponse[]> {
  try {
    const products = await prisma.product.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        isActive,
        ...(userId ? { userId } : {}),
        ...(marketStandId ? { marketStandId } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Use the serializer to convert Prisma models to plain objects
    return serializeProducts(products);
  } catch (error: unknown) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch products", {
      limit,
      cursor,
      isActive,
      userId,
      marketStandId
    });
    
    // For product listing, we'll return an empty array instead of throwing
    console.error('Error fetching products:', errorData);
    return [];
  }
}

export async function getProduct(id: string): Promise<ProductResponse | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });
    
    if (!product) return null;
    
    // Use the serializer to convert Prisma model to plain object
    return serializeProduct(product);
  } catch (error: unknown) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch product", {
      productId: id
    });
    
    console.error('Error fetching product:', errorData);
    return null;
  }
}

type CreateProductInput = Omit<ProductResponse, 
  'id' | 'createdAt' | 'updatedAt' | 'marketStand' | 'locationName' | 'averageRating' | 'totalReviews'
>;

export async function createProduct(data: CreateProductInput): Promise<ProductResponse> {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        images: data.images,
        inventory: data.inventory,
        inventoryUpdatedAt: data.inventoryUpdatedAt ? new Date(data.inventoryUpdatedAt) : null,
        status: data.status,
        isActive: data.isActive,
        userId: data.userId,
        marketStandId: data.marketStandId,
        tags: data.tags
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    // Use the serializer to convert Prisma model to plain object
    return serializeProduct(product);
  } catch (error: unknown) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to create product", {
      name: data.name,
      userId: data.userId,
      marketStandId: data.marketStandId
    });
    
    throw new Error(errorData.error);
  }
}

type UpdateProductInput = Partial<Omit<CreateProductInput, 'userId' | 'marketStandId'>>;

export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ProductResponse> {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        inventoryUpdatedAt: data.inventoryUpdatedAt ? new Date(data.inventoryUpdatedAt) : undefined
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    // Use the serializer to convert Prisma model to plain object
    return serializeProduct(product);
  } catch (error: unknown) {
    // Check for "not found" error specifically
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    // Use the error handler utility for other errors
    const errorData = handleDatabaseError(error, "Failed to update product", {
      productId: id,
      ...data
    });
    
    throw new Error(errorData.error);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await prisma.product.delete({
      where: { id }
    });
  } catch (error: unknown) {
    // Check for "not found" error specifically
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    // Use the error handler utility for other errors
    const errorData = handleDatabaseError(error, "Failed to delete product", {
      productId: id
    });
    
    throw new Error(errorData.error);
  }
}
