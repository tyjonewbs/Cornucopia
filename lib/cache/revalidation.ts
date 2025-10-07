import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Cache tag constants for data revalidation
 */
export const CacheTags = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product-${id}`,
  MARKET_STANDS: 'market-stands',
  MARKET_STAND: (id: string) => `market-stand-${id}`,
  USER_PRODUCTS: (userId: string) => `user-products-${userId}`,
  USER_MARKET_STAND: (userId: string) => `user-market-stand-${userId}`,
} as const;

/**
 * Revalidate all product-related caches
 */
export function revalidateProducts() {
  revalidateTag(CacheTags.PRODUCTS);
  revalidatePath('/', 'page');
  revalidatePath('/dashboard/sell', 'page');
}

/**
 * Revalidate a specific product cache
 */
export function revalidateProduct(productId: string) {
  revalidateTag(CacheTags.PRODUCT(productId));
  revalidateTag(CacheTags.PRODUCTS);
  revalidatePath('/', 'page');
  revalidatePath(`/product/${productId}`, 'page');
}

/**
 * Revalidate user's products
 */
export function revalidateUserProducts(userId: string) {
  revalidateTag(CacheTags.USER_PRODUCTS(userId));
  revalidateTag(CacheTags.PRODUCTS);
  revalidatePath('/dashboard/sell', 'page');
}

/**
 * Revalidate all market stand caches
 */
export function revalidateMarketStands() {
  revalidateTag(CacheTags.MARKET_STANDS);
  revalidatePath('/', 'page');
  revalidatePath('/dashboard/market-stand', 'page');
}

/**
 * Revalidate a specific market stand cache
 */
export function revalidateMarketStand(standId: string) {
  revalidateTag(CacheTags.MARKET_STAND(standId));
  revalidateTag(CacheTags.MARKET_STANDS);
  revalidatePath(`/market-stand/${standId}`, 'page');
  revalidatePath('/dashboard/market-stand', 'page');
}

/**
 * Revalidate user's market stand
 */
export function revalidateUserMarketStand(userId: string) {
  revalidateTag(CacheTags.USER_MARKET_STAND(userId));
  revalidateTag(CacheTags.MARKET_STANDS);
  revalidatePath('/dashboard/market-stand', 'page');
}
