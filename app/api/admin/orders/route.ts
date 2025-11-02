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
    const status = searchParams.get('status');
    const producerId = searchParams.get('producerId');
    const zoneId = searchParams.get('zoneId');

    // Build where clause
    const where: any = {
      type: 'DELIVERY', // Only delivery orders
    };

    if (status) {
      where.status = status;
    }

    if (zoneId) {
      where.deliveryZoneId = zoneId;
    }

    if (producerId) {
      where.marketStand = {
        userId: producerId
      };
    }

    const orders = await prisma.order.findMany({
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
        marketStand: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        deliveryZone: {
          select: {
            id: true,
            name: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        },
        issues: {
          select: {
            id: true,
            issueType: true,
            status: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit for performance
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
