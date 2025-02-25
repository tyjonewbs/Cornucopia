import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return new NextResponse("Invalid quantity", { status: 400 });
    }

    // Verify product ownership through market stand
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        marketStand: {
          userId: user.id,
        },
      },
      include: {
        marketStand: true,
      },
    });

    if (!product) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Update product inventory
    const updatedProduct = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        inventory: quantity,
        inventoryUpdatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        inventory: true,
      },
    });

    // Format response
    const formattedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      image: updatedProduct.images[0] || '',
      quantity: updatedProduct.inventory || 0,
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('[PRODUCT_QUANTITY_UPDATE]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
