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
