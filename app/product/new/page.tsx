import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/db";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { SellForm } from "@/components/form/Sellform";
import { MarketStandSelect } from "@/components/MarketStandSelect";

async function getUserMarketStands(userId: string) {
  const marketStands = await prisma.marketStand.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      images: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      userId: true,
    },
  });
  return marketStands;
}

async function getUserDeliveryZones(userId: string) {
  const deliveryZones = await prisma.deliveryZone.findMany({
    where: {
      userId: userId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      deliveryFee: true,
      zipCodes: true,
      cities: true,
      states: true,
    },
  });
  return deliveryZones;
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: { marketStandId?: string };
}) {
  noStore();
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const [marketStands, deliveryZones] = await Promise.all([
    getUserMarketStands(user.id),
    getUserDeliveryZones(user.id),
  ]);

  // Users can create products without market stands or delivery zones
  // They'll be prompted to add fulfillment options later

  // Use the market stand from query param if provided, otherwise use the first one
  const defaultMarketStand = searchParams.marketStandId
    ? marketStands.find(stand => stand.id === searchParams.marketStandId) || marketStands[0]
    : marketStands[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Card>
        <SellForm 
          marketStand={defaultMarketStand} 
          marketStands={marketStands}
          deliveryZones={deliveryZones}
        />
      </Card>
    </div>
  );
}
