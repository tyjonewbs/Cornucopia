import { DeliveryZoneEditOrchestrator } from "@/components/delivery/DeliveryZoneEditOrchestrator";
import { getDeliveryZone, getProductsWithZoneStatus } from "@/app/actions/delivery-zones";
import { DeliveryZone, ScheduledDate } from "@/types/delivery";
import { redirect } from "next/navigation";

export default async function EditDeliveryZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [zoneResult, productsResult] = await Promise.all([
    getDeliveryZone(id),
    getProductsWithZoneStatus(id),
  ]);

  if (!zoneResult.success || !zoneResult.zone) {
    redirect("/dashboard/delivery-zones");
  }

  const deliveryZone = {
    ...zoneResult.zone,
    deliveryType: (zoneResult.zone as any).deliveryType || 'ONE_TIME' as const,
    scheduledDates: (zoneResult.zone as any).scheduledDates
      ? ((zoneResult.zone as any).scheduledDates as ScheduledDate[])
      : undefined
  } as DeliveryZone;

  const products = productsResult.success ? productsResult.products || [] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DeliveryZoneEditOrchestrator
        zone={deliveryZone}
        products={products}
      />
    </div>
  );
}
