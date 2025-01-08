import { Card } from "../../../components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { MarketStandForm } from "../../../components/form/MarketStandForm";
import prisma from "../../../lib/db";

async function getUserMarketStand(userId: string) {
  const marketStand = await prisma.marketStand.findUnique({
    where: {
      userId: userId
    }
  });
  return marketStand;
}

export default async function MarketStandSetupPage() {
  noStore();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const marketStand = await getUserMarketStand(user.id);
  if (marketStand) {
    return redirect("/market-stand");
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-14">
      <Card>
        <MarketStandForm userId={user.id} />
      </Card>
    </section>
  );
}
