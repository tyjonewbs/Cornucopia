import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const user = await getUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, inventory } = body;

    if (!id || typeof inventory !== 'number') {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // Check if product exists and belongs to user
    const product = await prisma.product.findUnique({
      where: {
        id,
        userId: user.id
      }
    });

    if (!product) {
      return new NextResponse("Product not found or unauthorized", { status: 404 });
    }

    // Update product inventory with user check
    const updatedProduct = await prisma.product.update({
      where: {
        id,
        userId: user.id // Ensure user owns the product
      },
      data: {
        inventory,
        inventoryUpdatedAt: new Date()
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // Check if product exists and belongs to user
    const product = await prisma.product.findUnique({
      where: {
        id,
        userId: user.id
      }
    });

    if (!product) {
      return new NextResponse("Product not found or unauthorized", { status: 404 });
    }

    // Update product with user check
    const updatedProduct = await prisma.product.update({
      where: {
        id,
        userId: user.id // Ensure user owns the product
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
