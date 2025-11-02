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

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const issues = await prisma.orderIssue.findMany({
      where,
      include: {
        order: {
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
            }
          }
        },
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        resolvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Error fetching admin issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
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
    const { issueId, status, resolution, adminNotes, refundAmount } = body;

    if (!issueId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (refundAmount !== undefined) {
      updateData.refundAmount = refundAmount;
      updateData.refundedAt = new Date();
    }

    if (status === 'RESOLVED' || status === 'REFUNDED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = user.id;
    }

    const issue = await prisma.orderIssue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        order: {
          select: {
            orderNumber: true,
          }
        }
      }
    });

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
