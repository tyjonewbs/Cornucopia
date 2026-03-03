import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getPurchaseDetail } from "@/app/actions/orders";
import PurchaseDetailClient from "./purchase-detail-client";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const purchase = await getPurchaseDetail(id);

  if (!purchase) {
    notFound();
  }

  return <PurchaseDetailClient purchase={purchase} />;
}
