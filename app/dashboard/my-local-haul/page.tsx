import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/db';
import { MyLocalHaulClient } from './client';

async function getUserHaulData(userId: string) {
  try {
    const [orders, savedProducts, reviews, subscriptions] = await Promise.all([
      // Fetch user's orders
      prisma.order.findMany({
        where: { userId },
        include: {
          marketStand: {
            select: {
              id: true,
              name: true,
              locationName: true,
              images: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      // Fetch saved products
      prisma.savedProduct.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              inventory: true,
              isActive: true,
              marketStand: {
                select: {
                  id: true,
                  name: true,
                  locationName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Fetch user's reviews (both product and stand reviews)
      Promise.all([
        prisma.productReview.findMany({
          where: { userId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                marketStand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.standReview.findMany({
          where: { userId },
          include: {
            marketStand: {
              select: {
                id: true,
                name: true,
                images: true,
                locationName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]),

      // Fetch subscriptions
      prisma.marketStandSubscription.findMany({
        where: { userId },
        include: {
          marketStand: {
            select: {
              id: true,
              name: true,
              locationName: true,
              images: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const [productReviews, standReviews] = reviews;

    return {
      orders,
      savedProducts,
      productReviews,
      standReviews,
      subscriptions,
    };
  } catch (error) {
    console.error('[My Local Haul] Error fetching data:', error);
    return {
      orders: [],
      savedProducts: [],
      productReviews: [],
      standReviews: [],
      subscriptions: [],
    };
  }
}

export default async function MyLocalHaulPage() {
  noStore();

  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const haulData = await getUserHaulData(user.id);

  return <MyLocalHaulClient initialData={haulData} />;
}
