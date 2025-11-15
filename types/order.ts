import { Order, OrderItem, OrderStatus, OrderType } from '@prisma/client';

export type { Order, OrderItem, OrderStatus, OrderType };

// Extended types with relations
export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
  marketStand: {
    id: string;
    name: string;
    locationName: string;
    images: string[];
  };
}

export interface OrderItemWithProduct extends OrderItem {
  product: {
    id: string;
    name: string;
    images: string[];
    marketStandId: string;
  };
}

// DTO types for API responses
export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string;
  marketStandId: string;
  marketStandName: string;
  type: OrderType;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  fees: number;
  notes: string | null;
  pickupTime: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  priceAtTime: number;
}

// Form types for creating orders
export interface CreateOrderInput {
  marketStandId: string;
  type: OrderType;
  items: {
    productId: string;
    quantity: number;
  }[];
  notes?: string;
  pickupTime?: Date;
  deliveryAddress?: string;
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

// Filter types
export interface OrderFilters {
  status?: OrderStatus;
  type?: OrderType;
  startDate?: Date;
  endDate?: Date;
}

// Order status helpers
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  READY: 'Ready for Pickup',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
};

// Status colors for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  READY: 'green',
  DELIVERED: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
};
