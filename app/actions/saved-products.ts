"use server";

import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";

/**
 * Toggle a product's saved status for the current user.
 * Creates or deletes a SavedProduct row.
 * Returns { saved: boolean } on success, or { error: string } if not authenticated.
 */
export async function toggleSavedProduct(
  productId: string
): Promise<{ saved: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user) {
      return { saved: false, error: "NOT_AUTHENTICATED" };
    }

    const existing = await prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.savedProduct.delete({
        where: { id: existing.id },
      });
      return { saved: false };
    } else {
      await prisma.savedProduct.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      return { saved: true };
    }
  } catch (error) {
    console.error("[toggleSavedProduct] Error:", error);
    return { saved: false, error: "SAVE_FAILED" };
  }
}

/**
 * Check if the current user has saved a specific product.
 * Returns false if not authenticated.
 */
export async function getProductSavedStatus(
  productId: string
): Promise<boolean> {
  try {
    const user = await getUser();
    if (!user) return false;

    const existing = await prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    return !!existing;
  } catch {
    return false;
  }
}
