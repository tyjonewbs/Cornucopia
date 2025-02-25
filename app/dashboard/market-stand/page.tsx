import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { MarketStandDashboardClient } from "./market-stand-client";
import { unstable_noStore as noStore } from "next/cache";

<<<<<<< HEAD
interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  locationName: string;
  locationGuide: string;
  latitude: number;
  longitude: number;
  images: string[];
  tags: string[];
  _count: {
    products: number;
  };
=======
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
      description: stand.description || null, // Ensure null instead of undefined
      tags: stand.tags || [], // Ensure array even if null/undefined
      _count: {
        products: stand._count.products
      }
    }));
  } catch (err) {
    return [];
  }
>>>>>>> posthog
}

export default async function MarketStandDashboard() {
  noStore();
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const marketStands = await prisma.marketStand.findMany({
    where: { userId: user.id.toString() },
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
          products: true
        }
      }
    }
  });

  return <MarketStandDashboardClient initialMarketStands={marketStands} />;
}
