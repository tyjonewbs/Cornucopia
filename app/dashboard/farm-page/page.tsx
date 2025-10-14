import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { FarmPageClient } from "./farm-page-client";
import { unstable_noStore as noStore } from "next/cache";

async function getUserFarms(userId: string) {
  try {
    const farms = await prisma.local.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        story: true,
        images: true,
        farmingPractices: true,
        teamMembers: true,
        certifications: true,
        seasonalSchedule: true,
        events: true,
        operatingHours: true,
        wholesaleInfo: true,
        locationName: true,
        locationGuide: true,
        latitude: true,
        longitude: true,
        website: true,
        socialMedia: true,
        createdAt: true,
        products: {
          select: {
            id: true,
            name: true,
            images: true,
            tags: true,
            price: true,
          },
          take: 10,
        },
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
    return farms.map(farm => ({
      ...farm,
      description: farm.description || "",
      story: farm.story || "",
      wholesaleInfo: farm.wholesaleInfo || null,
      website: farm.website || null,
      socialMedia: farm.socialMedia || [],
      createdAt: farm.createdAt.toISOString(),
      products: farm.products.map(p => ({
        ...p,
        tags: p.tags || [],
      })),
    }));
  } catch (err) {
    console.error("Error fetching farms:", err);
    return [];
  }
}

export default async function FarmPage() {
  noStore();
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const farms = await getUserFarms(user.id.toString());

  return <FarmPageClient farms={farms} />;
}
