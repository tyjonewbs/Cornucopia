import { z } from 'zod';
import { OrderStatus, OrderType } from '@prisma/client';

// Order creation schema
export const createOrderSchema = z.object({
  marketStandId: z.string().uuid('Invalid market stand ID'),
  type: z.nativeEnum(OrderType),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ).min(1, 'Order must contain at least one item'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  pickupTime: z.coerce.date().optional(),
  deliveryAddress: z.string().max(500, 'Address must be 500 characters or less').optional(),
});

// Order status update schema
export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  status: z.nativeEnum(OrderStatus),
});

// Order filter schema
export const orderFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  type: z.nativeEnum(OrderType).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusSchema = z.infer<typeof updateOrderStatusSchema>;
export type OrderFiltersSchema = z.infer<typeof orderFiltersSchema>;
