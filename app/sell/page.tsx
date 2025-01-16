import { Card } from "../../components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "../../lib/db";
import { getUser } from "@/lib/auth";
import { SellPageClient } from "@/app/sell/sell-client";

async function getUserMarketStands(userId: string) {
  const marketStands = await prisma.marketStand.findMany({
    where: {
      userId: userId
    }
  });
  return marketStands;
}

export default async function SellRoute() {
  noStore();
  const user = await getUser();

  if (!user) {
    return redirect('/');
  }

  const marketStands = await getUserMarketStands(user.id);
  if (!marketStands.length) {
    return redirect("/market-stand/setup");
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-14">
      <Card className="p-6 space-y-6">
        <SellPageClient marketStands={marketStands} />
      </Card>
    </section>
  );
}
