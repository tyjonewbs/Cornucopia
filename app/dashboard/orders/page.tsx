import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDeliveryOrders } from "@/app/actions/orders";
import OrdersClient from "./orders-client";

export default async function OrdersPage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch delivery orders grouped by day and zone
  const ordersByDay = await getDeliveryOrders();

  return <OrdersClient ordersByDay={ordersByDay} />;
}
