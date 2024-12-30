import prisma from "../../lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { ClientWrapper } from "./ClientWrapper";

async function getData() {
  const marketStands = await prisma.marketStand.findMany({
    include: {
      products: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          marketStandId: true,
        }
      },
      user: {
        select: {
          firstName: true,
          profileImage: true
        }
      }
    }
  });

  return marketStands;
}

export default async function MarketStandsPage() {
  noStore();
  const marketStands = await getData();

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Stands</h1>
        <p className="text-muted-foreground mt-2">
          Discover local market stands near you
        </p>
      </div>

      <ClientWrapper marketStands={marketStands} />
    </section>
  );
}
