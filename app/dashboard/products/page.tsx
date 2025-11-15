import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProductsWithListings, getDeliveryOrderCounts } from "@/app/actions/products";
import { getUserDeliveryZones } from "@/app/actions/delivery-zones";
import { marketStandService } from "@/lib/services/marketStandService";
import { DeliveryZoneInfo } from "@/types/delivery";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch user's products with their stand listings
  const products = await getProductsWithListings();

  // Fetch user's delivery zones for the filter
  const deliveryZonesResult = await getUserDeliveryZones();
  const deliveryZones: DeliveryZoneInfo[] = deliveryZonesResult.success && deliveryZonesResult.zones
    ? deliveryZonesResult.zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        zipCodes: zone.zipCodes,
        cities: zone.cities,
        states: zone.states,
        deliveryFee: zone.deliveryFee,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
        minimumOrder: zone.minimumOrder,
        deliveryDays: zone.deliveryDays,
        deliveryTimeWindows: zone.deliveryTimeWindows,
      }))
    : [];

  // Fetch user's market stands
  const marketStandsData = await marketStandService.getMarketStandsByUserId(user.id);
  const marketStands = marketStandsData.map(stand => ({
    id: stand.id,
    name: stand.name
  }));

  // Fetch delivery order counts
  const orderCounts = await getDeliveryOrderCounts(user.id);

  return (
    <ProductsClient 
      initialProducts={products}
      deliveryZones={deliveryZones}
      userId={user.id}
      marketStands={marketStands}
      orderCounts={orderCounts}
    />
  );
}
