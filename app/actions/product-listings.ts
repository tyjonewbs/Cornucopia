"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function createProductListing(
  productId: string,
  marketStandId: string,
  inventory: number = 0
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify product ownership
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { userId: true }
  });

  if (product?.userId !== user.id) {
    throw new Error("You don't own this product");
  }

  // Create listing
  const listing = await prisma.productStandListing.create({
    data: {
      productId,
      marketStandId,
      customInventory: inventory,
      isActive: true,
      isPrimary: false, // Can implement primary logic later
    },
  });

  revalidatePath("/dashboard/products");
  return { success: true, listing };
}

export async function updateListingInventory(
  listingId: string,
  inventory: number
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership via product
  const listing = await prisma.productStandListing.findUnique({
    where: { id: listingId },
    include: { product: { select: { userId: true } } }
  });

  if (listing?.product.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.productStandListing.update({
    where: { id: listingId },
    data: { 
      customInventory: inventory,
      updatedAt: new Date()
    },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function removeProductListing(listingId: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const listing = await prisma.productStandListing.findUnique({
    where: { id: listingId },
    include: { product: { select: { userId: true } } }
  });

  if (listing?.product.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.productStandListing.delete({
    where: { id: listingId },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function getProductListings(productId: string) {
  const listings = await prisma.productStandListing.findMany({
    where: { productId, isActive: true },
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
  });

  return listings;
}

export async function getProductsWithListings(userId: string) {
  const products = await prisma.product.findMany({
    where: { 
      userId,
      // Don't filter by isActive - show all
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
        }
      },
      deliveryZone: {
        select: {
          id: true,
          name: true,
          deliveryFee: true,
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return products;
}
