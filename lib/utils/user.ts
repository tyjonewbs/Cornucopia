import prisma from "@/lib/db";

/**
 * Check if a user is a producer (has at least one product)
 */
export async function isUserProducer(userId: string): Promise<boolean> {
  const productCount = await prisma.product.count({
    where: {
      userId,
      isActive: true,
    },
  });
  
  return productCount > 0;
}

/**
 * Get producer status and product count for a user
 */
export async function getUserProducerInfo(userId: string): Promise<{
  isProducer: boolean;
  productCount: number;
}> {
  const productCount = await prisma.product.count({
    where: {
      userId,
      isActive: true,
    },
  });
  
  return {
    isProducer: productCount > 0,
    productCount,
  };
}
