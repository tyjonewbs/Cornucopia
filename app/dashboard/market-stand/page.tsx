import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { MarketStandDashboardClient } from "./market-stand-client";
import { unstable_noStore as noStore } from "next/cache";

async function getMarketStandsWithProducts(userId: string) {
  const stands = await prisma.marketStand.findMany({
    where: { userId },
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
      productListings: {
        where: { isActive: true },
        select: {
          id: true,
          productId: true,
          customInventory: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { productListings: { where: { isActive: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return stands.map(({ productListings, _count, ...stand }) => ({
    ...stand,
    description: stand.description || null,
    tags: stand.tags || [],
    standListings: productListings.map((l) => ({
      ...l,
      updatedAt: l.updatedAt.toISOString(),
    })),
    _count: {
      standListings: _count.productListings,
    },
  }));
}

async function getAllUserProducts(userId: string) {
  const products = await prisma.product.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
    },
    orderBy: { name: "asc" },
  });
  return products;
}

export default async function MarketStandDashboard() {
  noStore();
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [marketStands, allProducts] = await Promise.all([
    getMarketStandsWithProducts(user.id.toString()),
    getAllUserProducts(user.id.toString()),
  ]);

  return (
    <MarketStandDashboardClient
      initialMarketStands={marketStands}
      allProducts={allProducts}
    />
  );
}
