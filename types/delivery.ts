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

export interface DeliveryZoneInfo {
  id: string;
  name: string;
  zipCodes: string[];
  cities: string[];
  states: string[];
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
  minimumOrder?: number | null;
  deliveryDays: string[];
  deliveryTimeWindows?: any;
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
}

export interface SerializedDeliveryEligibilityResult {
  isEligible: boolean;
  reason?: string;
  matchedZipCode?: string;
  matchedCity?: string;
  deliveryOptions: SerializedDeliveryOption[];
}
