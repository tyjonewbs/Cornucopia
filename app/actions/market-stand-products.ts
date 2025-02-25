'use server';

import { type SerializedProduct } from "./home-products";
export type { SerializedProduct };

export async function getMarketStandProducts(marketStandId: string): Promise<SerializedProduct[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/market-stand/${marketStandId}/products`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch market stand products');
    }

    const products = await response.json();
    
    return products.map((product: any) => ({
      ...product,
      updatedAt: new Date(product.updatedAt).toISOString(),
      distance: null // Market stand products don't need distance calculation
    }));
  } catch (error) {
    console.error('Error in getMarketStandProducts:', error);
    return [];
  }
}
