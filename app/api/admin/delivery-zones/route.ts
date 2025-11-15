import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const flagged = searchParams.get('flagged');
    const suspended = searchParams.get('suspended');

    const where: any = {};

    if (flagged === 'true') {
      where.flaggedForReview = true;
    }

    if (suspended === 'true') {
      where.isSuspended = true;
    }

    const zones = await prisma.deliveryZone.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            orders: true,
            products: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate active orders for each zone
    const zonesWithActiveOrders = await Promise.all(
      zones.map(async (zone) => {
        const activeOrdersCount = await prisma.order.count({
          where: {
            deliveryZoneId: zone.id,
            status: {
              in: ['PENDING', 'CONFIRMED', 'READY']
            }
          }
        });

        return {
          ...zone,
          activeOrdersCount
        };
      })
    );

    return NextResponse.json({ zones: zonesWithActiveOrders });
  } catch (error) {
    console.error("Error fetching delivery zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery zones" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser();

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { zoneId, action, reason } = body;

    if (!zoneId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'FLAG':
        updateData = {
          flaggedForReview: true,
          flagReason: reason || 'Flagged by admin for review',
        };
        break;

      case 'UNFLAG':
        updateData = {
          flaggedForReview: false,
          flagReason: null,
        };
        break;

      case 'SUSPEND':
        updateData = {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedById: user.id,
          suspensionReason: reason || 'Suspended by admin',
          isActive: false, // Disable the zone
        };
        break;

      case 'UNSUSPEND':
        updateData = {
          isSuspended: false,
          suspendedAt: null,
          suspendedById: null,
          suspensionReason: null,
          isActive: true, // Re-enable the zone
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const zone = await prisma.deliveryZone.update({
      where: { id: zoneId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return NextResponse.json({ zone });
  } catch (error) {
    console.error("Error updating delivery zone:", error);
    return NextResponse.json(
      { error: "Failed to update delivery zone" },
      { status: 500 }
    );
  }
}
