import { MarketStandSubscription, NotificationType } from '@prisma/client';

export type { MarketStandSubscription, NotificationType };

// Extended types with relations
export interface SubscriptionWithStand extends MarketStandSubscription {
  marketStand: {
    id: string;
    name: string;
    locationName: string;
    images: string[];
    isActive: boolean;
  };
}

// DTO types for API responses
export interface SubscriptionDTO {
  id: string;
  userId: string;
  marketStandId: string;
  marketStandName: string;
  marketStandImage: string | null;
  notificationTypes: NotificationType[];
  createdAt: string;
  updatedAt: string;
}

// Form types
export interface CreateSubscriptionInput {
  marketStandId: string;
  notificationTypes: NotificationType[];
}

export interface UpdateSubscriptionInput {
  subscriptionId: string;
  notificationTypes: NotificationType[];
}

// Notification type labels and descriptions
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  NEW_PRODUCTS: 'New Products',
  PRICE_CHANGES: 'Price Changes',
  BACK_IN_STOCK: 'Back in Stock',
  SPECIAL_ANNOUNCEMENTS: 'Special Announcements',
  ORDER_UPDATES: 'Order Updates',
  HOURS_CHANGES: 'Hours Changes',
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  NEW_PRODUCTS: 'Get notified when new products are added',
  PRICE_CHANGES: 'Get notified when product prices change',
  BACK_IN_STOCK: 'Get notified when out-of-stock items are restocked',
  SPECIAL_ANNOUNCEMENTS: 'Receive special announcements and promotions',
  ORDER_UPDATES: 'Get updates about your orders',
  HOURS_CHANGES: 'Get notified when operating hours change',
};

// Default notification types for new subscriptions
export const DEFAULT_NOTIFICATION_TYPES: NotificationType[] = [
  'NEW_PRODUCTS',
  'ORDER_UPDATES',
];

// All available notification types
export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'NEW_PRODUCTS',
  'PRICE_CHANGES',
  'BACK_IN_STOCK',
  'SPECIAL_ANNOUNCEMENTS',
  'ORDER_UPDATES',
  'HOURS_CHANGES',
];
