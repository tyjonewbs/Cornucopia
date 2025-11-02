import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProductsWithListings, getDeliveryOrderCounts } from "@/app/actions/products";
import { getUserDeliveryZones } from "@/app/actions/delivery-zones";
import { marketStandService } from "@/lib/services/marketStandService";
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
  const deliveryZones = deliveryZonesResult.success ? deliveryZonesResult.zones : [];

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
