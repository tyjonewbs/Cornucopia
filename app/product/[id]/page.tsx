import prisma from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { ProductPageClient } from "./product-page-client";
import { notFound } from "next/navigation";
import { getNearbyProducts } from "@/app/actions/nearby-products";

async function getData(id: string) {
  const data = await prisma.product.findUnique({
    where: {
      id: id,
    },
    select: {
      description: true,
      name: true,
      images: true,
      price: true,
      updatedAt: true,
      id: true,
      userId: true,
      inventory: true,
      inventoryUpdatedAt: true,
      tags: true,
      deliveryAvailable: true,
      deliveryDates: true,
      availableDate: true,
      availableUntil: true,
      averageRating: true,
      totalReviews: true,
      marketStandId: true,
      user: {
        select: {
          id: true,
          profileImage: true,
          firstName: true,
          connectedAccountId: true,
          stripeConnectedLinked: true,
        },
      },
      marketStand: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          locationName: true,
          streetAddress: true,
          city: true,
          zipCode: true,
          locationGuide: true,
          hours: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
          products: {
            where: {
              isActive: true,
              status: 'APPROVED',
            },
            select: {
              id: true,
              name: true,
              images: true,
              updatedAt: true,
              price: true,
              inventory: true,
            },
            take: 3,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      },
      standListings: {
        where: { isActive: true },
        select: {
          marketStand: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
              locationName: true,
            }
          }
        }
      },
      deliveryZone: {
        select: {
          id: true,
          name: true,
          deliveryFee: true,
          minimumOrder: true,
          freeDeliveryThreshold: true,
          zipCodes: true,
          cities: true,
          states: true,
          deliveryDays: true,
        }
      },
      deliveryListings: {
        select: {
          inventory: true,
        }
      }
    },
  });

  if (!data) return null;

  // Serialize dates
  return {
    ...data,
    updatedAt: data.updatedAt.toISOString(),
    inventoryUpdatedAt: data.inventoryUpdatedAt?.toISOString() ?? null,
    deliveryDates: data.deliveryDates.map(d => d.toISOString()),
    availableDate: data.availableDate?.toISOString() ?? null,
    availableUntil: data.availableUntil?.toISOString() ?? null,
    marketStand: data.marketStand ? {
      ...data.marketStand,
      createdAt: data.marketStand.createdAt.toISOString(),
      products: data.marketStand.products.map(product => ({
        ...product,
        updatedAt: product.updatedAt.toISOString()
      }))
    } : null,
    standListings: data.standListings,
    deliveryZone: data.deliveryZone
  };
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const data = await getData(decodeURIComponent(params.id));

  if (!data) {
    notFound();
  }

  // Fetch nearby products if we have market stand location
  let nearbyProducts: Awaited<ReturnType<typeof getNearbyProducts>> = [];
  if (data.marketStand?.latitude && data.marketStand?.longitude) {
    nearbyProducts = await getNearbyProducts(
      data.id,
      data.marketStand.latitude,
      data.marketStand.longitude
    );
  }

  return <ProductPageClient data={data} nearbyProducts={nearbyProducts} />;
}
