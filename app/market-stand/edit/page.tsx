import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "../../../lib/db";

async function getUserMarketStand(userId: string) {
  const marketStand = await prisma.marketStand.findUnique({
    where: {
      userId: userId
    },
    select: {
      id: true
    }
  });
  return marketStand;
}

export default async function EditMarketStandRedirectPage() {
  noStore();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return redirect("/");
  }

  const marketStand = await getUserMarketStand(user.id);
  
  if (!marketStand) {
    return redirect("/market-stand/setup");
  }

  // Redirect to the edit page with the user's market stand ID
  return redirect(`/market-stand/edit/${marketStand.id}`);
}
