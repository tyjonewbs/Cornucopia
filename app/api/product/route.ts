import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validators/productSchemas";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter: 30 requests per minute for product API
const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "60s"),
  analytics: true,
  prefix: "@upstash/ratelimit/product",
});

export async function PATCH(req: Request) {
  try {
    const user = await getUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Apply rate limiting
    const { success } = await rateLimiter.limit(user.id);
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
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
  } catch {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Apply rate limiting
    const { success } = await rateLimiter.limit(user.id);
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // Validate the update data
    const validation = updateProductSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validation.error.issues },
        { status: 400 }
      );
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

    // Update product with user check (use validated data)
    const updatedProduct = await prisma.product.update({
      where: {
        id,
        userId: user.id // Ensure user owns the product
      },
      data: {
        ...validation.data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedProduct);
  } catch {
    return new NextResponse("Internal error", { status: 500 });
  }
}
