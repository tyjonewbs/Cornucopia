import { getUserDeliveryZones, getDeliveryZoneProducts, getProductsWithZoneStatus } from "@/app/actions/delivery-zones";
import { getDeliveriesForZone } from "@/app/actions/deliveries";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import DeliveryClient from "./delivery-client";
import { addDays, startOfDay } from "date-fns";

export default async function DeliveryZonesPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const result = await getUserDeliveryZones();

  if (!result.success) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-destructive">Error loading delivery zones: {result.error}</p>
        </div>
      </div>
    );
  }

  const allZones = result.zones || [];

  // Filter out ONE_TIME zones whose scheduled dates have all passed
  const today = startOfDay(new Date());
  const zones = allZones.filter((zone) => {
    if (zone.deliveryType === 'ONE_TIME' && zone.scheduledDates) {
      const scheduledDates = zone.scheduledDates as Array<{ date: string }>;
      return scheduledDates.some((sd) => new Date(sd.date) >= today);
    }
    return true;
  });

  // Fetch products, deliveries, and zone product status for ALL zones
  const zonesWithProducts = await Promise.all(
    zones.map(async (zone) => {
      const [productsResult, deliveriesResult, zoneProductsResult] = await Promise.all([
        getDeliveryZoneProducts(zone.id),
        getDeliveriesForZone(zone.id, {
          from: new Date(),
          to: addDays(new Date(), 28),
          statuses: ['SCHEDULED', 'OPEN', 'CLOSED'],
        }),
        getProductsWithZoneStatus(zone.id),
      ]);
      return {
        zone,
        productsByDay: productsResult.success ? productsResult.productsByDay : {},
        deliveries: deliveriesResult.success ? deliveriesResult.deliveries || [] : [],
        zoneProducts: zoneProductsResult.success ? zoneProductsResult.products || [] : [],
      };
    })
  );

  return <DeliveryClient zonesWithProducts={zonesWithProducts as any} />;
}
