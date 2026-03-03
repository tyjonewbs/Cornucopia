import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getUser } from "@/lib/auth";
import { getMyPurchases } from "@/app/actions/orders";
import PurchasesClient from "./purchases-client";

export default async function PurchasesPage() {
  noStore();

  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const purchases = await getMyPurchases();

  return <PurchasesClient purchases={purchases} />;
}
