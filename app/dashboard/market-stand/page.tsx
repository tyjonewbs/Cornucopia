import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { MarketStandDashboardClient } from "./market-stand-client";
import { unstable_noStore as noStore } from "next/cache";

async function getMarketStands(userId: string) {
  try {
    const stands = await prisma.marketStand.findMany({
      where: {
        userId: userId,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Ensure data is serializable
    return stands.map(stand => ({
      ...stand,
      description: stand.description || null,
      tags: stand.tags || [],
      _count: {
        products: stand._count.products
      }
    }));
  } catch (err) {
    return [];
  }
}

export default async function MarketStandDashboard() {
  noStore();
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const marketStands = await getMarketStands(user.id.toString());

  return <MarketStandDashboardClient initialMarketStands={marketStands} />;
}
