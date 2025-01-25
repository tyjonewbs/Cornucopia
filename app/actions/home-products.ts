'use server';

import prisma from "@/lib/db";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function getHomeProducts(userLocation?: { lat: number; lng: number } | null) {
  try {

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
        updatedAt: true,
        tags: true,
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          }
        }
      },
      take: 6,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const productsWithDistance = products.map(product => ({
      ...product,
      updatedAt: product.updatedAt.toISOString(),
      locationName: product.marketStand?.locationName || product.marketStand?.name || 'Unknown Location',
      distance: userLocation && product.marketStand
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            product.marketStand.latitude,
            product.marketStand.longitude
          )
        : undefined
    }));

    if (userLocation) {
      productsWithDistance.sort((a, b) => {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
      });
    }

    return productsWithDistance;
  } catch {
    return [];
  }
}
