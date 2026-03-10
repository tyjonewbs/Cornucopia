'use server';

import { getSupabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { addDays, getDay, startOfDay } from "date-fns";
import type { DeliveryStatus } from "@/types/delivery";

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get upcoming deliveries for a zone
 */
export async function getDeliveriesForZone(
  zoneId: string,
  options?: { from?: Date; to?: Date; statuses?: DeliveryStatus[] }
) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify zone belongs to user
    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id }
    });

    if (!zone) {
      return { success: false, error: "Delivery zone not found" };
    }

    const from = options?.from || new Date();
    const to = options?.to || addDays(new Date(), 56);
    const statuses = options?.statuses || ['SCHEDULED', 'OPEN', 'CLOSED', 'IN_TRANSIT'];

    const deliveries = await prisma.delivery.findMany({
      where: {
        userId: user.id,
        zones: { some: { id: zoneId } },
        date: { gte: from, lte: to },
        status: { in: statuses },
      },
      include: {
        zones: { select: { id: true, name: true } },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                inventory: true,
              }
            }
          }
        },
        _count: { select: { orders: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Serialize dates for client components
    const serialized = deliveries.map(d => ({
      id: d.id,
      userId: d.userId,
      date: d.date.toISOString(),
      status: d.status as DeliveryStatus,
      timeWindow: d.timeWindow,
      note: d.note,
      closedAt: d.closedAt?.toISOString() || null,
      completedAt: d.completedAt?.toISOString() || null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      zones: d.zones,
      products: d.products.map(dp => ({
        id: dp.id,
        productId: dp.productId,
        product: dp.product,
        cap: dp.cap,
      })),
      _count: d._count,
    }));

    return { success: true, deliveries: serialized };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching deliveries"
    };
  }
}

/**
 * Get a single delivery with full details
 */
export async function getDelivery(deliveryId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
      include: {
        zones: { select: { id: true, name: true } },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                inventory: true,
              }
            }
          }
        },
        _count: { select: { orders: true } },
      },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    return {
      success: true,
      delivery: {
        id: delivery.id,
        userId: delivery.userId,
        date: delivery.date.toISOString(),
        status: delivery.status as DeliveryStatus,
        timeWindow: delivery.timeWindow,
        note: delivery.note,
        closedAt: delivery.closedAt?.toISOString() || null,
        completedAt: delivery.completedAt?.toISOString() || null,
        createdAt: delivery.createdAt.toISOString(),
        updatedAt: delivery.updatedAt.toISOString(),
        zones: delivery.zones,
        products: delivery.products.map(dp => ({
          id: dp.id,
          productId: dp.productId,
          product: dp.product,
          cap: dp.cap,
        })),
        _count: delivery._count,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching delivery"
    };
  }
}

/**
 * Get aggregated order counts per product for a delivery
 */
export async function getDeliveryOrderSummary(deliveryId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    // Get order item quantities grouped by product
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        order: {
          deliveryId,
          status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
        }
      }
    });

    const summary = delivery.products.map(dp => {
      const orderData = orderItems.find(oi => oi.productId === dp.productId);
      return {
        productId: dp.productId,
        productName: dp.product.name,
        orderedQuantity: orderData?._sum.quantity || 0,
        cap: dp.cap,
      };
    });

    return { success: true, summary };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching order summary"
    };
  }
}

/**
 * Create a new delivery
 */
export async function createDelivery(data: {
  date: Date;
  zoneIds: string[];
  timeWindow?: string;
  note?: string;
  productIds?: string[];
}) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify all zones belong to user
    const zones = await prisma.deliveryZone.findMany({
      where: { id: { in: data.zoneIds }, userId: user.id },
    });

    if (zones.length !== data.zoneIds.length) {
      return { success: false, error: "One or more zones not found" };
    }

    const delivery = await prisma.delivery.create({
      data: {
        userId: user.id,
        date: startOfDay(data.date),
        timeWindow: data.timeWindow || null,
        note: data.note || null,
        zones: { connect: data.zoneIds.map(id => ({ id })) },
        ...(data.productIds && data.productIds.length > 0 ? {
          products: {
            create: data.productIds.map(productId => ({
              productId,
            }))
          }
        } : {}),
      },
      include: {
        zones: { select: { id: true, name: true } },
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, images: true, inventory: true }
            }
          }
        },
      },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, delivery };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { success: false, error: "A delivery already exists for this date" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating delivery"
    };
  }
}

/**
 * Close a delivery (stop accepting orders)
 */
export async function closeDelivery(deliveryId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    if (!['SCHEDULED', 'OPEN'].includes(delivery.status)) {
      return { success: false, error: "Can only close scheduled or open deliveries" };
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, delivery: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error closing delivery"
    };
  }
}

/**
 * Reopen a delivery
 */
export async function reopenDelivery(deliveryId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    if (delivery.status !== 'CLOSED') {
      return { success: false, error: "Can only reopen closed deliveries" };
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'OPEN', closedAt: null },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, delivery: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error reopening delivery"
    };
  }
}

/**
 * Complete a delivery
 */
export async function completeDelivery(deliveryId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    if (['COMPLETED', 'CANCELLED'].includes(delivery.status)) {
      return { success: false, error: "Delivery is already completed or cancelled" };
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, delivery: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error completing delivery"
    };
  }
}

/**
 * Cancel a delivery (only if no paid orders)
 */
export async function cancelDelivery(deliveryId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
      include: {
        _count: {
          select: {
            orders: { where: { paymentStatus: 'PAID' } }
          } as any
        }
      }
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    // Check for paid orders
    const paidOrders = await prisma.order.count({
      where: { deliveryId, paymentStatus: 'PAID' }
    });

    if (paidOrders > 0) {
      return { success: false, error: "Cannot cancel a delivery with paid orders" };
    }

    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: 'CANCELLED' },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, delivery: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error cancelling delivery"
    };
  }
}

/**
 * Add a product to a delivery
 */
export async function addProductToDelivery(
  deliveryId: string,
  productId: string,
  cap?: number | null
) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify delivery belongs to user
    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: user.id },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const deliveryProduct = await prisma.deliveryProduct.upsert({
      where: {
        deliveryId_productId: { deliveryId, productId }
      },
      create: {
        deliveryId,
        productId,
        cap: cap ?? null,
      },
      update: {
        cap: cap ?? null,
      },
      include: {
        product: {
          select: { id: true, name: true, price: true, images: true, inventory: true }
        }
      }
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, deliveryProduct };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error adding product to delivery"
    };
  }
}

/**
 * Remove a product from a delivery
 */
export async function removeProductFromDelivery(deliveryId: string, productId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    await prisma.deliveryProduct.delete({
      where: {
        deliveryId_productId: { deliveryId, productId }
      },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error removing product from delivery"
    };
  }
}

/**
 * Update the cap for a product on a delivery
 */
export async function updateDeliveryProductCap(
  deliveryId: string,
  productId: string,
  cap: number | null
) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id: deliveryId, userId: user.id },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    const updated = await prisma.deliveryProduct.update({
      where: {
        deliveryId_productId: { deliveryId, productId }
      },
      data: { cap },
    });

    revalidatePath('/dashboard/delivery-zones');

    return { success: true, deliveryProduct: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating product cap"
    };
  }
}

/**
 * Generate recurring deliveries for a zone (idempotent)
 */
export async function generateDeliveriesForZone(zoneId: string, weeksAhead: number = 8) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id },
      include: {
        productListings: {
          include: {
            product: { select: { id: true } }
          }
        }
      }
    });

    if (!zone) {
      return { success: false, error: "Delivery zone not found" };
    }

    if (zone.deliveryType !== 'RECURRING' || !zone.deliveryDays.length) {
      return { success: true, deliveries: [], message: "Zone is not recurring or has no delivery days" };
    }

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const today = startOfDay(new Date());
    const created: string[] = [];

    // For each delivery day, generate deliveries for next N weeks
    for (const dayName of zone.deliveryDays) {
      const targetDay = dayMap[dayName];
      if (targetDay === undefined) continue;

      // Find next occurrence
      let current = new Date(today);
      const daysUntil = (targetDay + 7 - current.getDay()) % 7;
      current.setDate(current.getDate() + (daysUntil === 0 ? 0 : daysUntil));

      for (let week = 0; week < weeksAhead; week++) {
        const deliveryDate = new Date(current);
        deliveryDate.setDate(deliveryDate.getDate() + week * 7);

        // Skip past dates
        if (deliveryDate < today) continue;

        try {
          // Upsert delivery (idempotent on userId+date)
          const delivery = await prisma.delivery.upsert({
            where: {
              userId_date: {
                userId: user.id,
                date: deliveryDate,
              }
            },
            create: {
              userId: user.id,
              date: deliveryDate,
              status: 'SCHEDULED',
              zones: { connect: [{ id: zoneId }] },
            },
            update: {
              // Connect this zone if not already connected
              zones: { connect: [{ id: zoneId }] },
            },
          });

          // Create DeliveryProduct records from zone's product listings for this day
          const listingsForDay = zone.productListings.filter(
            l => l.dayOfWeek.toLowerCase() === dayName.toLowerCase()
          );

          for (const listing of listingsForDay) {
            await prisma.deliveryProduct.upsert({
              where: {
                deliveryId_productId: {
                  deliveryId: delivery.id,
                  productId: listing.productId,
                }
              },
              create: {
                deliveryId: delivery.id,
                productId: listing.productId,
                cap: null, // Use global inventory by default
              },
              update: {},
            });
          }

          created.push(delivery.id);
        } catch {
          // Skip duplicates or conflicts
          continue;
        }
      }
    }

    revalidatePath('/dashboard/delivery-zones');

    return {
      success: true,
      message: `Generated/updated ${created.length} deliveries`,
      count: created.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error generating deliveries"
    };
  }
}

/**
 * Generate deliveries from one-time scheduled dates
 */
export async function generateOneTimeDeliveries(
  zoneId: string,
  scheduledDates: Array<{ date: string; timeWindow?: string; note?: string }>
) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, userId: user.id },
    });

    if (!zone) {
      return { success: false, error: "Delivery zone not found" };
    }

    const created: string[] = [];

    for (const sd of scheduledDates) {
      const deliveryDate = startOfDay(new Date(sd.date));

      // Skip past dates
      if (deliveryDate < startOfDay(new Date())) continue;

      try {
        const delivery = await prisma.delivery.upsert({
          where: {
            userId_date: { userId: user.id, date: deliveryDate }
          },
          create: {
            userId: user.id,
            date: deliveryDate,
            status: 'SCHEDULED',
            timeWindow: sd.timeWindow || null,
            note: sd.note || null,
            zones: { connect: [{ id: zoneId }] },
          },
          update: {
            zones: { connect: [{ id: zoneId }] },
            ...(sd.timeWindow ? { timeWindow: sd.timeWindow } : {}),
            ...(sd.note ? { note: sd.note } : {}),
          },
        });

        created.push(delivery.id);
      } catch {
        continue;
      }
    }

    revalidatePath('/dashboard/delivery-zones');

    return {
      success: true,
      message: `Generated ${created.length} deliveries`,
      count: created.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error generating deliveries"
    };
  }
}

/**
 * Get user's products (for product association panel)
 */
export async function getUserProducts() {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const products = await prisma.product.findMany({
      where: { userId: user.id, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        inventory: true,
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching products"
    };
  }
}
