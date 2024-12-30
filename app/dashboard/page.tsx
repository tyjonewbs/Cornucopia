import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "../../lib/db";
import { DashboardTabs } from "./tabs";

async function getMarketStandData(userId: string) {
  const marketStand = await prisma.marketStand.findUnique({
    where: {
      userId: userId
    },
    include: {
      user: {
        select: {
          firstName: true,
          profileImage: true,
          stripeConnectedLinked: true
        }
      },
      products: true
    }
  });

  return marketStand;
}

async function getProducts(userId: string) {
  const products = await prisma.product.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    }
  });

  return products;
}

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return redirect("/");
  }

  const [marketStand, products] = await Promise.all([
    getMarketStandData(user.id),
    getProducts(user.id)
  ]);

  return (
    <div className="container mx-auto py-10">
      <DashboardTabs 
        marketStand={marketStand}
        products={products}
      />
    </div>
  );
}
