import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const marketStands = await prisma.marketStand.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        locationName: true,
        locationGuide: true,
        latitude: true,
        longitude: true,
        images: true,
        tags: true,
        _count: {
          select: {
            products: true,
          },
        },
        products: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
          select: {
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Ensure data is serializable
    const serializedStands = marketStands.map(stand => ({
      ...stand,
      description: stand.description || null,
      tags: stand.tags || [],
      _count: {
        products: stand._count.products
      },
      lastProductUpdate: stand.products[0]?.updatedAt || null,
      products: undefined // Remove products array from response
    }));

    return NextResponse.json(serializedStands);
  } catch (error) {
    console.error('[MARKET_STAND_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
