"use server";

import prisma from "lib/db";
import { Status } from "@prisma/client";

// Types for product responses
interface ProductResponse {
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
  };
  tags: string[];
  locationName?: string;
}

export async function getProducts(userId?: string): Promise<ProductResponse[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(userId ? { userId } : {})
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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
        locationName: product.marketStand.locationName
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
            locationName: true
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
        locationName: product.marketStand.locationName
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
            locationName: true
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
        locationName: product.marketStand.locationName
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
            locationName: true
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
        locationName: product.marketStand.locationName
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
