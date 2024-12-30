import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

export async function GET() {
  try {
    const marketStands = await prisma.marketStand.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    return NextResponse.json(marketStands);
  } catch (error) {
    console.error('Failed to fetch market stands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market stands' },
      { status: 500 }
    );
  }
}
