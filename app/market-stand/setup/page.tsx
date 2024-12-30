import { Card } from "components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "../../../lib/db";
import { MarketStandForm } from "../../../components/form/MarketStandForm";
import { StripeConnectButton } from "../../../components/StripeConnectButton";

async function getUserMarketStand(userId: string) {
  const marketStand = await prisma.marketStand.findUnique({
    where: {
      userId: userId
    }
  });
  return marketStand;
}

async function getUserStripeStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectedLinked: true }
  });
  return user?.stripeConnectedLinked || false;
}

export default async function SetupPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // If user already has a market stand, redirect to sell page
  const marketStand = await getUserMarketStand(user.id);
  if (marketStand) {
    return redirect("/sell");
  }

  const hasStripeConnected = await getUserStripeStatus(user.id);

  return (
    <section className="max-w-4xl mx-auto px-4 md:px-8 mb-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Setup Your Market Stand</h1>
        <p className="text-muted-foreground mt-2">
          Before you can start selling, you need to set up your market stand where your products will be available.
        </p>
      </div>

      {!hasStripeConnected && (
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Connect Payment Processing</h2>
          <p className="text-muted-foreground mb-6">
            To receive payments from your customers, you need to connect your Stripe account. This allows you to process payments securely and receive your earnings directly.
          </p>
          <StripeConnectButton />
        </Card>
      )}

      <Card>
        <MarketStandForm userId={user.id} />
      </Card>
    </section>
  );
}
