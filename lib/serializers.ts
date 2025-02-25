/**
 * Serializers for converting Prisma models to plain objects
 * This helps avoid serialization issues and standardizes the format of data
 * returned from server actions
 */

import { MarketStand, Product } from "@prisma/client";

/**
 * Serialize a market stand to a plain object
 */
export function serializeMarketStand(marketStand: MarketStand & any): any {
  return {
    id: marketStand.id,
    name: marketStand.name,
    description: marketStand.description,
    locationName: marketStand.locationName,
    locationGuide: marketStand.locationGuide,
    latitude: marketStand.latitude,
    longitude: marketStand.longitude,
    website: marketStand.website,
    images: marketStand.images,
    tags: marketStand.tags,
    socialMedia: marketStand.socialMedia,
    hours: marketStand.hours,
    userId: marketStand.userId,
    createdAt: marketStand.createdAt.toISOString(),
    updatedAt: marketStand.updatedAt.toISOString(),
    // Include any additional fields that might be included via relations
    ...(marketStand.user ? { 
      user: {
        firstName: marketStand.user.firstName,
        lastName: marketStand.user.lastName,
        profileImage: marketStand.user.profileImage
      } 
    } : {}),
    ...(marketStand._count ? { _count: marketStand._count } : {}),
    ...(marketStand.products ? { 
      products: marketStand.products.map(serializeProduct)
    } : {})
  };
}

/**
 * Serialize a product to a plain object
 */
export function serializeProduct(product: Product & any): any {
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
    tags: product.tags,
    // Include marketStand if it's loaded
    ...(product.marketStand ? {
      marketStand: {
        id: product.marketStand.id,
        name: product.marketStand.name,
        locationName: product.marketStand.locationName,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude,
        ...(product.marketStand.user ? {
          user: {
            firstName: product.marketStand.user.firstName,
            profileImage: product.marketStand.user.profileImage
          }
        } : {})
      },
      locationName: product.marketStand.locationName
    } : {})
  };
}

/**
 * Serialize an array of products to plain objects
 */
export function serializeProducts(products: (Product & any)[]): any[] {
  return products.map(serializeProduct);
}

/**
 * Serialize an array of market stands to plain objects
 */
export function serializeMarketStands(marketStands: (MarketStand & any)[]): any[] {
  return marketStands.map(serializeMarketStand);
}
