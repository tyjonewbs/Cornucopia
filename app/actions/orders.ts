"use server";

import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { OrderStatus, OrderType, PaymentStatus, IssueType, IssueStatus } from "@prisma/client";

// ============================================================
// Shared Types
// ============================================================

export interface OrderItemData {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  priceAtTime: number;
}

// ============================================================
// Seller Types
// ============================================================

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryDate: Date;
  status: OrderStatus;
  items: OrderItemData[];
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

export interface PickupOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  pickupTime: Date | null;
  status: OrderStatus;
  items: OrderItemData[];
  totalAmount: number;
  notes: string | null;
  marketStandName: string;
  marketStandLocation: string | null;
}

export interface PickupOrdersByStand {
  standId: string;
  standName: string;
  standLocation: string | null;
  orders: PickupOrder[];
}

export interface SellerOrders {
  deliveryOrdersByDay: DeliveryOrdersByDay;
  pickupOrdersByStand: PickupOrdersByStand[];
}

// ============================================================
// Buyer Types
// ============================================================

export interface Purchase {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  type: OrderType;
  totalAmount: number;
  subtotal: number;
  tax: number;
  fees: number;
  createdAt: Date;
  notes: string | null;
  deliveryAddress: string | null;
  deliveryDate: Date | null;
  pickupTime: Date | null;
  marketStandName: string;
  marketStandLocation: string | null;
  deliveryZoneName: string | null;
  items: OrderItemData[];
  hasActiveIssue: boolean;
}

// ============================================================
// Detail Types
// ============================================================

export interface OrderIssueData {
  id: string;
  issueType: IssueType;
  description: string;
  status: IssueStatus;
  resolution: string | null;
  refundAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
  reportedByName: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  type: OrderType;
  totalAmount: number;
  subtotal: number;
  tax: number;
  fees: number;
  platformFee: number;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  deliveryAddress: string | null;
  deliveryDate: string | null;
  pickupTime: string | null;
  customerName: string;
  customerEmail: string;
  marketStandName: string;
  marketStandLocation: string | null;
  deliveryZoneName: string | null;
  items: OrderItemData[];
  issues: OrderIssueData[];
}

export interface PurchaseDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  type: OrderType;
  totalAmount: number;
  subtotal: number;
  tax: number;
  fees: number;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  deliveryAddress: string | null;
  deliveryDate: string | null;
  pickupTime: string | null;
  marketStandId: string;
  marketStandName: string;
  marketStandLocation: string | null;
  deliveryZoneName: string | null;
  items: OrderItemData[];
  issues: OrderIssueData[];
  hasActiveIssue: boolean;
}

// ============================================================
// Buyer Actions
// ============================================================

export async function getMyPurchases(): Promise<Purchase[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      marketStand: {
        select: {
          name: true,
          locationName: true,
        },
      },
      deliveryZone: {
        select: { name: true },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      },
      issues: {
        where: {
          status: { in: ['PENDING', 'INVESTIGATING'] },
        },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    type: order.type,
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    tax: order.tax,
    fees: order.fees,
    createdAt: order.createdAt,
    notes: order.notes,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate,
    pickupTime: order.pickupTime,
    marketStandName: order.marketStand.name,
    marketStandLocation: order.marketStand.locationName,
    deliveryZoneName: order.deliveryZone?.name || null,
    items: order.items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0] || null,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
    })),
    hasActiveIssue: order.issues.length > 0,
  }));
}

// ============================================================
// Seller Actions
// ============================================================

export async function getSellerOrders(): Promise<SellerOrders> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // --- Delivery Orders (existing logic) ---
  const deliveryZones = await prisma.deliveryZone.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, name: true }
  });

  const zoneIds = deliveryZones.map(z => z.id);

  let deliveryOrdersByDay: DeliveryOrdersByDay = {};

  if (zoneIds.length > 0) {
    const deliveryOrders = await prisma.order.findMany({
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

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    deliveryOrders.forEach(order => {
      if (!order.deliveryDate || !order.deliveryZone) return;

      const dayOfWeek = DAYS[order.deliveryDate.getDay()];
      const zoneId = order.deliveryZone.id;
      const zoneName = order.deliveryZone.name;

      if (!deliveryOrdersByDay[dayOfWeek]) {
        deliveryOrdersByDay[dayOfWeek] = [];
      }

      let zoneGroup = deliveryOrdersByDay[dayOfWeek].find(z => z.zoneId === zoneId);
      if (!zoneGroup) {
        zoneGroup = { zoneId, zoneName, orders: [] };
        deliveryOrdersByDay[dayOfWeek].push(zoneGroup);
      }

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
  }

  // --- Pickup Orders (new) ---
  const userStands = await prisma.marketStand.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, name: true, locationName: true },
  });

  const standIds = userStands.map(s => s.id);

  let pickupOrdersByStand: PickupOrdersByStand[] = [];

  if (standIds.length > 0) {
    const pickupOrders = await prisma.order.findMany({
      where: {
        marketStandId: { in: standIds },
        type: 'PICKUP',
        status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
          },
        },
      },
      orderBy: { pickupTime: 'asc' },
    });

    // Group by market stand
    const standMap = new Map<string, PickupOrdersByStand>();

    pickupOrders.forEach(order => {
      const standId = order.marketStand.id;

      if (!standMap.has(standId)) {
        standMap.set(standId, {
          standId,
          standName: order.marketStand.name,
          standLocation: order.marketStand.locationName,
          orders: [],
        });
      }

      const customerName = order.user.firstName && order.user.lastName
        ? `${order.user.firstName} ${order.user.lastName}`
        : order.user.email;

      standMap.get(standId)!.orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName,
        customerEmail: order.user.email,
        pickupTime: order.pickupTime,
        status: order.status,
        items: order.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0] || null,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        })),
        totalAmount: order.totalAmount,
        notes: order.notes,
        marketStandName: order.marketStand.name,
        marketStandLocation: order.marketStand.locationName,
      });
    });

    pickupOrdersByStand = Array.from(standMap.values());
  }

  return { deliveryOrdersByDay, pickupOrdersByStand };
}

// Valid order status transitions for sellers
const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "READY", "CANCELLED"],
  CONFIRMED: ["READY", "DELIVERED", "COMPLETED", "CANCELLED"],
  READY: ["DELIVERED", "COMPLETED", "CANCELLED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Update order status (seller action)
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      deliveryZone: {
        select: { userId: true }
      },
      marketStand: {
        select: { userId: true }
      },
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Authorize: user must own the delivery zone OR the market stand
  const isDeliveryZoneOwner = order.deliveryZone?.userId === user.id;
  const isMarketStandOwner = order.marketStand?.userId === user.id;

  if (!isDeliveryZoneOwner && !isMarketStandOwner) {
    throw new Error("Unauthorized");
  }

  // Validate status transition
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
  if (!allowedTransitions.includes(status)) {
    throw new Error(`Cannot change order status from ${order.status} to ${status}`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });
}

// ============================================================
// Detail Actions
// ============================================================

function mapIssues(issues: Array<{
  id: string;
  issueType: IssueType;
  description: string;
  status: IssueStatus;
  resolution: string | null;
  refundAmount: number | null;
  createdAt: Date;
  resolvedAt: Date | null;
  reportedBy: { firstName: string | null; lastName: string | null; email: string };
}>): OrderIssueData[] {
  return issues.map(issue => ({
    id: issue.id,
    issueType: issue.issueType,
    description: issue.description,
    status: issue.status,
    resolution: issue.resolution,
    refundAmount: issue.refundAmount,
    createdAt: issue.createdAt.toISOString(),
    resolvedAt: issue.resolvedAt?.toISOString() || null,
    reportedByName: issue.reportedBy.firstName && issue.reportedBy.lastName
      ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`
      : issue.reportedBy.email,
  }));
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const user = await getUser();
  if (!user) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { email: true, firstName: true, lastName: true },
      },
      marketStand: {
        select: { name: true, locationName: true, userId: true },
      },
      deliveryZone: {
        select: { name: true, userId: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true },
          },
        },
      },
      issues: {
        include: {
          reportedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) return null;

  // Authorize: user must own the delivery zone OR the market stand
  const isDeliveryZoneOwner = order.deliveryZone?.userId === user.id;
  const isMarketStandOwner = order.marketStand?.userId === user.id;
  if (!isDeliveryZoneOwner && !isMarketStandOwner) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    type: order.type,
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    tax: order.tax,
    fees: order.fees,
    platformFee: order.platformFee,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    notes: order.notes,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate?.toISOString() || null,
    pickupTime: order.pickupTime?.toISOString() || null,
    customerName: order.user.firstName && order.user.lastName
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.user.email,
    customerEmail: order.user.email,
    marketStandName: order.marketStand.name,
    marketStandLocation: order.marketStand.locationName,
    deliveryZoneName: order.deliveryZone?.name || null,
    items: order.items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0] || null,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
    })),
    issues: mapIssues(order.issues),
  };
}

export async function getPurchaseDetail(orderId: string): Promise<PurchaseDetail | null> {
  const user = await getUser();
  if (!user) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      marketStand: {
        select: { id: true, name: true, locationName: true },
      },
      deliveryZone: {
        select: { name: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true },
          },
        },
      },
      issues: {
        include: {
          reportedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) return null;

  // Authorize: buyer must be the order owner
  if (order.userId !== user.id) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    type: order.type,
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    tax: order.tax,
    fees: order.fees,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    notes: order.notes,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate?.toISOString() || null,
    pickupTime: order.pickupTime?.toISOString() || null,
    marketStandId: order.marketStand.id,
    marketStandName: order.marketStand.name,
    marketStandLocation: order.marketStand.locationName,
    deliveryZoneName: order.deliveryZone?.name || null,
    items: order.items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0] || null,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
    })),
    issues: mapIssues(order.issues),
    hasActiveIssue: order.issues.some(i => i.status === 'PENDING' || i.status === 'INVESTIGATING'),
  };
}
