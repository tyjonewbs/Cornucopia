import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/app/actions/orders";
import OrderDetailClient from "./order-detail-client";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
