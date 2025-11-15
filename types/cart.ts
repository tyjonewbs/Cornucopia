/**
 * Cart System Type Definitions
 * Supports multi-product cart with delivery route grouping and tax compliance
 */

// Tax categorization for agricultural exemption compliance
export type TaxCode = 'RAW_FOOD' | 'PREPARED_FOOD' | 'NON_FOOD';

// Fulfillment types
export type FulfillmentType = 'DELIVERY' | 'PICKUP';

/**
 * Cart - User's shopping cart
 */
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CartItem - Individual item in cart with fulfillment details
 */
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: CartItemProduct;
  quantity: number;
  fulfillmentType: FulfillmentType;
  
  // Delivery-specific fields
  deliveryDate?: Date;
  deliveryZoneId?: string;
  deliveryZone?: CartItemDeliveryZone;
  
  // Pickup-specific fields
  marketStandId?: string;
  marketStand?: CartItemMarketStand;
  pickupTime?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product data needed for cart display
 */
export interface CartItemProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  taxCode: TaxCode;
  taxable: boolean;
  inventory: number;
  userId: string;
}

/**
 * Delivery zone data for cart item
 */
export interface CartItemDeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
  minimumOrder?: number | null;
}

/**
 * Market stand data for cart item
 */
export interface CartItemMarketStand {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

/**
 * Grouped cart items by fulfillment type and date/location
 */
export interface CartGroup {
  type: FulfillmentType;
  key: string;  // Unique identifier for this group
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  
  // Delivery group specific
  deliveryDate?: Date;
  deliveryZone?: {
    id: string;
    name: string;
    deliveryFee: number;
    freeDeliveryThreshold?: number | null;
    minimumOrder?: number | null;
  };
  
  // Pickup group specific
  marketStand?: {
    id: string;
    name: string;
    locationName: string;
  };
  pickupTime?: Date;
}

/**
 * Overall cart totals
 */
export interface CartTotals {
  subtotal: number;
  deliveryFees: number;
  tax: number;
  total: number;
  itemCount: number;
}

/**
 * Parameters for adding item to cart
 */
export interface AddToCartParams {
  userId: string;
  productId: string;
  quantity: number;
  fulfillmentType: FulfillmentType;
  
  // Delivery params
  deliveryDate?: Date;
  deliveryZoneId?: string;
  
  // Pickup params
  marketStandId?: string;
  pickupTime?: Date;
}

/**
 * Tax calculation parameters
 */
export interface TaxCalculationParams {
  items: Array<{
    productId: string;
    amount: number;      // In cents
    quantity: number;
    taxCode: TaxCode;
  }>;
  customerAddress: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: 'US';
  };
  shipping?: number;     // Delivery fee in cents
}

/**
 * Tax calculation result
 */
export interface TaxCalculationResult {
  taxAmount: number;     // In cents
  breakdown?: TaxBreakdown[];
  jurisdiction?: string;
}

/**
 * Tax breakdown by jurisdiction
 */
export interface TaxBreakdown {
  jurisdiction: string;
  rate: number;
  amount: number;
  type: 'state' | 'county' | 'city' | 'district';
}

/**
 * Delivery route recommendation
 */
export interface RouteRecommendation {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
  };
  deliveryZoneId: string;
  deliveryDate: Date;
}

/**
 * Cart validation result
 */
export interface CartValidation {
  isValid: boolean;
  errors: CartValidationError[];
}

/**
 * Cart validation error
 */
export interface CartValidationError {
  itemId: string;
  productId: string;
  productName: string;
  type: 'out_of_stock' | 'insufficient_inventory' | 'product_inactive' | 'zone_inactive';
  message: string;
  currentInventory?: number;
  requestedQuantity?: number;
}

/**
 * Server action results
 */
export interface CartActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
