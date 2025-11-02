import type { DeliveryZone } from "./delivery";
import type { Status } from "@prisma/client";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  tags: string[];
  inventory: number;
  inventoryUpdatedAt: Date | null;
  status: Status;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // Now optional - for delivery-only products
  marketStandId: string | null;
  
  // Delivery fields
  deliveryAvailable: boolean;
  deliveryZoneId: string | null;
  
  // Availability dates
  availableDate: Date | null;
  availableUntil: Date | null;
  
  // Flag for products without fulfillment (needs setup later)
  needsFulfillment: boolean;
  
  // Rating fields
  averageRating: number | null;
  totalReviews: number;
}

export interface MarketStandLocation {
  id: string;
  name: string;
  distance: number | null;
  locationName: string;
}

export interface DeliveryInfo {
  isAvailable: boolean;
  deliveryFee: number | null;
  zoneName: string | null;
  zoneId: string | null;
  minimumOrder: number | null;
  freeDeliveryThreshold: number | null;
}

export interface ExtendedProduct extends Product {
  distance?: number;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
  marketStand?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    locationName: string;
  } | null;
  deliveryZone?: DeliveryZone | null;
  availableAt?: MarketStandLocation[];
  deliveryInfo?: DeliveryInfo | null;
}

// Helper type for availability status
export interface ProductAvailabilityStatus {
  isAvailableNow: boolean;
  isPreOrder: boolean;
  isSeasonal: boolean;
  availabilityLabel: string;
}

// Helper type for fulfillment options
export interface ProductFulfillmentInfo {
  hasPickup: boolean;
  hasDelivery: boolean;
  canOrderNow: boolean;
  fulfillmentLabel: string;
}

// Utility function to calculate availability status
export function getProductAvailability(product: Product): ProductAvailabilityStatus {
  const now = new Date();
  const availableDate = product.availableDate ? new Date(product.availableDate) : null;
  const availableUntil = product.availableUntil ? new Date(product.availableUntil) : null;

  const isAvailableNow = 
    (!availableDate || availableDate <= now) && 
    (!availableUntil || availableUntil >= now);

  const isPreOrder = availableDate ? availableDate > now : false;
  const isSeasonal = !!(availableDate && availableUntil);

  let availabilityLabel = '';
  if (isPreOrder && availableDate) {
    availabilityLabel = `Available ${availableDate.toLocaleDateString()}`;
  } else if (isSeasonal && availableUntil) {
    availabilityLabel = `Until ${availableUntil.toLocaleDateString()}`;
  } else if (isAvailableNow) {
    availabilityLabel = 'Available Now';
  } else {
    availabilityLabel = 'Not Currently Available';
  }

  return {
    isAvailableNow,
    isPreOrder,
    isSeasonal,
    availabilityLabel,
  };
}

// Utility function to get fulfillment information
export function getProductFulfillment(product: Product): ProductFulfillmentInfo {
  const hasPickup = !!product.marketStandId;
  const hasDelivery = product.deliveryAvailable;
  const availability = getProductAvailability(product);
  const canOrderNow = availability.isAvailableNow && (hasPickup || hasDelivery);

  let fulfillmentLabel = '';
  if (hasPickup && hasDelivery) {
    fulfillmentLabel = 'Pickup & Delivery';
  } else if (hasPickup) {
    fulfillmentLabel = 'Pickup Only';
  } else if (hasDelivery) {
    fulfillmentLabel = 'Delivery Only';
  }

  return {
    hasPickup,
    hasDelivery,
    canOrderNow,
    fulfillmentLabel,
  };
}

// Cross-listing types
export interface ProductStandListing {
  id: string;
  productId: string;
  marketStandId: string;
  isActive: boolean;
  isPrimary: boolean;
  customPrice: number | null;
  customInventory: number | null;
  createdAt: Date;
  updatedAt: Date;
  marketStand?: {
    id: string;
    name: string;
    locationName: string;
  };
}

export interface ProductWithListings extends Product {
  standListings: ProductStandListing[];
  deliveryZone?: DeliveryZone | null;
}
