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
  revalidatePath("/dashboard/market-stand");
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
  revalidatePath("/dashboard/market-stand");
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
  revalidatePath("/dashboard/market-stand");
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

export async function getProductsForStand(marketStandId: string) {
  const user = await getUser();
  if (!user) return { success: false, products: [] };

  // Get all user products with their listing for this specific stand
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    include: {
      standListings: {
        where: { marketStandId, isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    success: true,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      images: p.images,
      // If there's a listing, use its inventory; otherwise 0
      listingId: p.standListings[0]?.id || null,
      inventory: p.standListings[0]?.customInventory ?? 0,
      isInStand: p.standListings.length > 0,
      updatedAt: p.standListings[0]?.updatedAt || p.updatedAt,
    })),
  };
}

export async function updateStandProductInventory(
  productId: string,
  marketStandId: string,
  inventory: number
) {
  const user = await getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Verify product ownership
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { userId: true },
  });
  if (product?.userId !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (inventory <= 0) {
    // Remove the listing if inventory goes to 0
    await prisma.productStandListing.deleteMany({
      where: { productId, marketStandId },
    });
  } else {
    // Upsert the listing
    const existing = await prisma.productStandListing.findFirst({
      where: { productId, marketStandId },
    });

    if (existing) {
      await prisma.productStandListing.update({
        where: { id: existing.id },
        data: { customInventory: inventory, isActive: true, updatedAt: new Date() },
      });
    } else {
      await prisma.productStandListing.create({
        data: {
          productId,
          marketStandId,
          customInventory: inventory,
          isActive: true,
          isPrimary: false,
        },
      });
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/market-stand");
  return { success: true };
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
