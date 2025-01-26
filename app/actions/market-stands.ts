'use server';

import db from "@/lib/db";

export interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  createdAt: Date;
  tags: string[];
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  user: {
    firstName: string;
    profileImage: string;
  };
}

export async function getMarketStands(): Promise<MarketStand[]> {
  try {
    const stands = await db.marketStand.findMany({
      where: {
        isActive: true
      },
      include: {
        products: true,
        user: {
          select: {
            firstName: true,
            profileImage: true
          }
        }
      }
    });

    return stands;
  } catch (error) {
    console.error('Error fetching market stands:', error);
    return [];
  }
}
