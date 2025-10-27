import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify market stand ownership
    const marketStand = await prisma.marketStand.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!marketStand) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Get products for the market stand with optimized query
    const products = await prisma.product.findMany({
      where: {
        marketStandId: params.id,
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        inventory: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100, // Limit to 100 products for performance
    });

    // Return products in the format the client expects
    return NextResponse.json(products);
  } catch (error) {
    console.error('[MARKET_STAND_PRODUCTS_GET]', error);
    // Return JSON error response instead of plain text
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
