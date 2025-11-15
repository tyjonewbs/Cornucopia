"use server";

import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export interface DeliveryOrderItem {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  priceAtTime: number;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryDate: Date;
  status: OrderStatus;
  items: DeliveryOrderItem[];
  totalAmount: number;
  notes: string | null;
}

export interface DeliveryZoneOrders {
  zoneId: string;
  zoneName: string;
  orders: DeliveryOrder[];
}

export interface DeliveryOrdersByDay {
  [dayOfWeek: string]: DeliveryZoneOrders[];
}

/**
 * Get all delivery orders for the producer, grouped by day and zone
 */
export async function getDeliveryOrders(): Promise<DeliveryOrdersByDay> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get all delivery zones for this user
  const deliveryZones = await prisma.deliveryZone.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, name: true }
  });

  const zoneIds = deliveryZones.map(z => z.id);

  if (zoneIds.length === 0) {
    return {};
  }

  // Fetch all active delivery orders
  const orders = await prisma.order.findMany({
    where: {
      deliveryZoneId: { in: zoneIds },
      status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
      deliveryDate: { not: null },
      type: 'DELIVERY'
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      },
      deliveryZone: {
        select: {
          id: true,
          name: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true
            }
          }
        }
      }
    },
    orderBy: { deliveryDate: 'asc' }
  });

  // Group by day of week and zone
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped: DeliveryOrdersByDay = {};

  orders.forEach(order => {
    if (!order.deliveryDate || !order.deliveryZone) return;

    const dayOfWeek = DAYS[order.deliveryDate.getDay()];
    const zoneId = order.deliveryZone.id;
    const zoneName = order.deliveryZone.name;

    // Initialize day if needed
    if (!grouped[dayOfWeek]) {
      grouped[dayOfWeek] = [];
    }

    // Find or create zone group
    let zoneGroup = grouped[dayOfWeek].find(z => z.zoneId === zoneId);
    if (!zoneGroup) {
      zoneGroup = {
        zoneId,
        zoneName,
        orders: []
      };
      grouped[dayOfWeek].push(zoneGroup);
    }

    // Add order to zone group
    const customerName = order.user.firstName && order.user.lastName
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.user.email;

    zoneGroup.orders.push({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName,
      customerEmail: order.user.email,
      deliveryAddress: order.deliveryAddress || '',
      deliveryDate: order.deliveryDate,
      status: order.status,
      items: order.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images[0] || null,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      })),
      totalAmount: order.totalAmount,
      notes: order.notes
    });
  });

  return grouped;
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify the order belongs to one of the user's delivery zones
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      deliveryZone: {
        select: { userId: true }
      }
    }
  });

  if (!order || !order.deliveryZone || order.deliveryZone.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });
}
