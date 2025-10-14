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

export default async function NewProductPage() {
  noStore();
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const marketStands = await getUserMarketStands(user.id);

  if (marketStands.length === 0) {
    return redirect("/dashboard/market-stand/setup/new");
  }

  // Use the first market stand as default
  const defaultMarketStand = marketStands[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Card>
        <SellForm marketStand={defaultMarketStand} />
      </Card>
    </div>
  );
}
