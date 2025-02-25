'use server';

import { type SerializedProduct } from "./home-products";
import { handleDatabaseError } from "@/lib/error-handler";
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
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch market stand products", {
      marketStandId,
      apiUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/market-stand/${marketStandId}/products`
    });
    
    console.error('Error fetching market stand products:', errorData);
    return [];
  }
}
