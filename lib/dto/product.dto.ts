import { Status } from "@prisma/client";

// Base product DTO
export interface ProductDTO {
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
  
  // Now optional for delivery-only products
  marketStandId: string | null;
  
  // Delivery fields
  deliveryAvailable: boolean;
  deliveryZoneId: string | null;
  
  // Availability dates
  availableDate: string | null;
  availableUntil: string | null;
  
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
  tags: string[];
}

// Product with market stand details
export interface ProductWithMarketStandDTO extends ProductDTO {
  marketStand?: {
    id: string;
    name: string;
    locationName?: string;
    latitude: number;
    longitude: number;
  } | null;
  deliveryZone?: {
    id: string;
    name: string;
    deliveryFee: number;
    freeDeliveryThreshold: number | null;
    minimumOrder: number | null;
  } | null;
  locationName?: string;
}

// Product creation DTO
export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt?: string | null;
  status: Status;
  isActive: boolean;
  userId: string;
  
  // Optional for delivery-only products
  marketStandId?: string | null;
  
  // Delivery fields
  deliveryAvailable?: boolean;
  deliveryZoneId?: string | null;
  
  // Availability dates
  availableDate?: string | null;
  availableUntil?: string | null;
  
  tags: string[];
}

// Product update DTO
export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  images?: string[];
  inventory?: number;
  inventoryUpdatedAt?: string | null;
  status?: Status;
  isActive?: boolean;
  marketStandId?: string | null;
  deliveryAvailable?: boolean;
  deliveryZoneId?: string | null;
  availableDate?: string | null;
  availableUntil?: string | null;
  tags?: string[];
}

// Product query filters
export interface ProductQueryFilters {
  userId?: string;
  marketStandId?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}

// Product list response
export interface ProductListDTO {
  products: ProductWithMarketStandDTO[];
  nextCursor?: string;
  hasMore: boolean;
}

// ProductStandListing DTO
export interface ProductStandListingDTO {
  id: string;
  productId: string;
  marketStandId: string;
  isActive: boolean;
  isPrimary: boolean;
  customPrice: number | null;
  customInventory: number | null;
  createdAt: string;
  updatedAt: string;
  marketStand?: {
    id: string;
    name: string;
    locationName: string;
  };
}

// ProductDeliveryListing DTO
export interface ProductDeliveryListingDTO {
  id: string;
  productId: string;
  deliveryZoneId: string;
  dayOfWeek: string;
  inventory: number;
  createdAt: string;
  updatedAt: string;
  deliveryZone?: {
    id: string;
    name: string;
    deliveryFee: number;
    deliveryDays: string[];
  };
}

// Product with listings DTO
export interface ProductWithListingsDTO extends ProductDTO {
  standListings: ProductStandListingDTO[];
  deliveryListings: ProductDeliveryListingDTO[];
  deliveryZone?: {
    id: string;
    name: string;
    deliveryFee: number;
    freeDeliveryThreshold: number | null;
    minimumOrder: number | null;
  } | null;
}

// Delivery day order counts
export interface DeliveryDayOrderCounts {
  [dayOfWeek: string]: {
    [deliveryZoneId: string]: number;
  };
}

// Serialization functions
export function serializeProductStandListing(listing: any): ProductStandListingDTO {
  return {
    id: listing.id,
    productId: listing.productId,
    marketStandId: listing.marketStandId,
    isActive: listing.isActive,
    isPrimary: listing.isPrimary,
    customPrice: listing.customPrice,
    customInventory: listing.customInventory,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    marketStand: listing.marketStand ? {
      id: listing.marketStand.id,
      name: listing.marketStand.name,
      locationName: listing.marketStand.locationName,
    } : undefined
  };
}

export function serializeProductDeliveryListing(listing: any): ProductDeliveryListingDTO {
  return {
    id: listing.id,
    productId: listing.productId,
    deliveryZoneId: listing.deliveryZoneId,
    dayOfWeek: listing.dayOfWeek,
    inventory: listing.inventory,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    deliveryZone: listing.deliveryZone ? {
      id: listing.deliveryZone.id,
      name: listing.deliveryZone.name,
      deliveryFee: listing.deliveryZone.deliveryFee,
      deliveryDays: listing.deliveryZone.deliveryDays,
    } : undefined
  };
}

export function serializeProductWithListings(product: any): ProductWithListingsDTO {
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
    deliveryAvailable: product.deliveryAvailable,
    deliveryZoneId: product.deliveryZoneId,
    availableDate: product.availableDate?.toISOString() || null,
    availableUntil: product.availableUntil?.toISOString() || null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    totalReviews: product.totalReviews,
    averageRating: product.averageRating,
    tags: product.tags,
    standListings: product.standListings?.map(serializeProductStandListing) || [],
    deliveryListings: product.deliveryListings?.map(serializeProductDeliveryListing) || [],
    deliveryZone: product.deliveryZone ? {
      id: product.deliveryZone.id,
      name: product.deliveryZone.name,
      deliveryFee: product.deliveryZone.deliveryFee,
      freeDeliveryThreshold: product.deliveryZone.freeDeliveryThreshold,
      minimumOrder: product.deliveryZone.minimumOrder,
    } : null
  };
}
