'use server'

import prisma from '@/lib/db';

export async function getProducts(userId: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
        inventory: true,
        inventoryUpdatedAt: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        totalReviews: true,
        marketStand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Serialize dates for client consumption
    return products.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      inventoryUpdatedAt: product.inventoryUpdatedAt?.toISOString() || null,
      locationName: product.marketStand?.name || 'Unknown Location',
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function getLatestProducts(userLocation?: { lat: number; lng: number } | null) {
  try {
    const data = await prisma.product.findMany({
      select: {
        name: true,
        id: true,
        images: true,
        updatedAt: true,
        price: true,
        marketStand: {
          select: {
            id: true,
            name: true,
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

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    if (userLocation && userLocation.lat && userLocation.lng) {
      return data.map(product => {
        const distance = product.marketStand ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          product.marketStand.latitude,
          product.marketStand.longitude
        ) : Infinity;

        return {
          ...product,
          updatedAt: product.updatedAt.toISOString(),
          locationName: product.marketStand ? product.marketStand.name : 'Unknown Location'
        };
      });
    }

    return data.map(product => ({
      ...product,
      updatedAt: product.updatedAt.toISOString(),
      locationName: product.marketStand?.name || 'Unknown Location'
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch latest products');
  }
}
