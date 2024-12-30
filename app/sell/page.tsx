import { Card } from "components/ui/card";
import { SellForm } from "components/form/Sellform";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "../../lib/db";

async function getUserMarketStand(userId: string) {
  const marketStand = await prisma.marketStand.findUnique({
    where: {
      userId: userId
    }
  });
  return marketStand;
}

export default async function SellRoute() {
  noStore();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const marketStand = await getUserMarketStand(user.id);
  if (!marketStand) {
    return redirect("/market-stand/setup");
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-14">
      <Card>
        <SellForm marketStand={marketStand} />
      </Card>
    </section>
  );
}
