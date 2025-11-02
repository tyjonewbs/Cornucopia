import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const reportIssueSchema = z.object({
  issueType: z.enum(['NOT_DELIVERED', 'WRONG_ITEMS', 'DAMAGED', 'POOR_QUALITY', 'LATE', 'OTHER']),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;

    // Verify the order exists and belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only report issues for your own orders" },
        { status: 403 }
      );
    }

    // Check if there's already a pending issue for this order
    const existingIssue = await prisma.orderIssue.findFirst({
      where: {
        orderId: orderId,
        status: {
          in: ['PENDING', 'INVESTIGATING']
        }
      }
    });

    if (existingIssue) {
      return NextResponse.json(
        { error: "There is already a pending issue for this order" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = reportIssueSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { issueType, description } = validationResult.data;

    // Create the issue
    const issue = await prisma.orderIssue.create({
      data: {
        orderId,
        reportedById: user.id,
        issueType,
        description,
        status: 'PENDING',
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            marketStand: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.id,
        orderNumber: order.orderNumber,
        issueType: issue.issueType,
        status: issue.status,
        createdAt: issue.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error reporting order issue:", error);
    return NextResponse.json(
      { error: "Failed to report issue" },
      { status: 500 }
    );
  }
}
