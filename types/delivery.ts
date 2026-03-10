export interface DeliveryOption {
  date: Date;
  dayOfWeek: string;
  timeWindow: string;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  minimumOrder?: number;
  inventory?: number;
  isRecurring: boolean;
}

export interface DeliveryEligibilityResult {
  isEligible: boolean;
  reason?: string;
  matchedZipCode?: string;
  matchedCity?: string;
  deliveryOptions: DeliveryOption[];
}

export interface ScheduledDate {
  date: string; // ISO date string
  timeWindow?: string;
  note?: string;
}

export interface DeliveryZoneInfo {
  id: string;
  name: string;
  description?: string | null;
  zipCodes: string[];
  cities: string[];
  states: string[];
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
  minimumOrder?: number | null;
  deliveryType: 'RECURRING' | 'ONE_TIME';
  deliveryDays: string[];
  deliveryTimeWindows?: any;
  scheduledDates?: ScheduledDate[];
  isActive?: boolean;
}

export interface SerializedDeliveryOption {
  date: string;
  dayOfWeek: string;
  timeWindow: string;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  minimumOrder?: number;
  inventory?: number;
  isRecurring: boolean;
  deliveryZoneId: string;
  deliveryId?: string;
}

export interface SerializedDeliveryEligibilityResult {
  isEligible: boolean;
  reason?: string;
  matchedZipCode?: string;
  matchedCity?: string;
  deliveryOptions: SerializedDeliveryOption[];
}

// Recurring delivery schedule (day -> enabled/inventory mapping)
export type DeliverySchedule = {
  [day: string]: {
    enabled: boolean;
    inventory: number;
  };
};

// Alias for DeliveryZone (matches DeliveryZoneInfo structure)
export type DeliveryZone = DeliveryZoneInfo;

// Delivery entity types
export type DeliveryStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface DeliveryProductInfo {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
  };
  cap: number | null;
}

export interface DeliveryInfo {
  id: string;
  userId: string;
  date: string;
  status: DeliveryStatus;
  timeWindow: string | null;
  note: string | null;
  closedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  zones: Array<{ id: string; name: string }>;
  products: DeliveryProductInfo[];
  _count?: {
    orders: number;
  };
}

export interface DeliveryWithOrderSummary extends DeliveryInfo {
  orderSummary: Array<{
    productId: string;
    productName: string;
    orderedQuantity: number;
    cap: number | null;
  }>;
}
