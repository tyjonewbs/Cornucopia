import { DeliveryZoneForm } from "@/components/form/DeliveryZoneForm";
import { getDeliveryZone } from "@/app/actions/delivery-zones";
import { DeliveryZone, ScheduledDate } from "@/types/delivery";
import { redirect } from "next/navigation";

export default async function EditDeliveryZonePage({ params }: { params: { id: string } }) {
  const result = await getDeliveryZone(params.id);

  if (!result.success || !result.zone) {
    redirect("/dashboard/delivery-zones");
  }

  // Transform the Prisma zone data to match DeliveryZone type
  const deliveryZone = {
    ...result.zone,
    deliveryType: (result.zone as any).deliveryType || 'ONE_TIME' as const,
    scheduledDates: (result.zone as any).scheduledDates 
      ? ((result.zone as any).scheduledDates as ScheduledDate[])
      : undefined
  } as DeliveryZone;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DeliveryZoneForm deliveryZone={deliveryZone} />
    </div>
  );
}
