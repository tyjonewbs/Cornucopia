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

    // Get products for the market stand
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
    });

    // Format products for response
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '', // Use first image or empty string
      quantity: product.inventory || 0,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('[MARKET_STAND_PRODUCTS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
