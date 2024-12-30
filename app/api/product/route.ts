import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../../../lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
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

    // Update product inventory
    const updatedProduct = await prisma.product.update({
      where: {
        id
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
