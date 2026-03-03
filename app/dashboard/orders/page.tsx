import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getUser } from "@/lib/auth";
import { getSellerOrders } from "@/app/actions/orders";
import OrdersClient from "./orders-client";

export default async function OrdersPage() {
  noStore();

  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const sellerOrders = await getSellerOrders();

  return <OrdersClient sellerOrders={sellerOrders} />;
}
