import { DeliveryZoneForm } from "@/components/form/DeliveryZoneForm";
import { getDeliveryZone } from "@/app/actions/delivery-zones";
import { redirect } from "next/navigation";

export default async function EditDeliveryZonePage({ params }: { params: { id: string } }) {
  const result = await getDeliveryZone(params.id);

  if (!result.success || !result.zone) {
    redirect("/dashboard/delivery-zones");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DeliveryZoneForm deliveryZone={result.zone} />
    </div>
  );
}
