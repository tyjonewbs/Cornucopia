import { getUserDeliveryZones } from "@/app/actions/delivery-zones";
import { getDeliveryOrders } from "@/app/actions/orders";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import DeliveryClient from "./delivery-client";

export default async function DeliveryZonesPage() {
  const supabase = getSupabaseServer();
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

  const zones = result.zones || [];
  const ordersByDay = await getDeliveryOrders();

  return <DeliveryClient zones={zones as any} ordersByDay={ordersByDay} />;
}
