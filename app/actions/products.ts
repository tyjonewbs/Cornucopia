"use server";

import prisma from "lib/db";
import { Status } from "@prisma/client";

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
      marketStand: product.marketStand ? {
        id: product.marketStand.id,
        name: product.marketStand.name,
        locationName: product.marketStand.locationName,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude
      } : undefined,
      tags: product.tags,
      locationName: product.marketStand?.locationName
    }));
  } catch {
    throw new Error('Failed to fetch products');
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

    return {
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
      marketStand: product.marketStand ? {
        id: product.marketStand.id,
        name: product.marketStand.name,
        locationName: product.marketStand.locationName,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude
      } : undefined,
      tags: product.tags,
      locationName: product.marketStand?.locationName
    };
  } catch {
    throw new Error('Failed to fetch product');
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

    return {
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
      marketStand: product.marketStand ? {
        id: product.marketStand.id,
        name: product.marketStand.name,
        locationName: product.marketStand.locationName,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude
      } : undefined,
      tags: product.tags,
      locationName: product.marketStand?.locationName
    };
  } catch {
    throw new Error('Failed to create product');
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

    return {
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
      marketStand: product.marketStand ? {
        id: product.marketStand.id,
        name: product.marketStand.name,
        locationName: product.marketStand.locationName,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude
      } : undefined,
      tags: product.tags,
      locationName: product.marketStand?.locationName
    };
  } catch {
    throw new Error('Failed to update product');
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await prisma.product.delete({
      where: { id }
    });
  } catch {
    throw new Error('Failed to delete product');
  }
}
