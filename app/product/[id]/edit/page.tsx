import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProduct } from "@/app/actions/products";
import { getUserDeliveryZones } from "@/app/actions/delivery-zones";
import { marketStandService } from "@/lib/services/marketStandService";
import { SellForm } from "@/components/form/Sellform";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch the product
  const product = await getProduct(params.id);

  if (!product) {
    redirect("/dashboard/products");
  }

  // Verify ownership
  if (product.userId !== user.id) {
    redirect("/dashboard/products");
  }

  // Fetch market stands and delivery zones for the form
  const marketStands = await marketStandService.getMarketStandsByUserId(user.id);
  const deliveryZonesResult = await getUserDeliveryZones();
  const deliveryZones = deliveryZonesResult.success ? deliveryZonesResult.zones : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">
            Update your product details, pricing, and availability
          </p>
        </div>

        <SellForm
          productId={product.id}
          userId={user.id}
          productName={product.name}
          marketStands={marketStands as any}
          deliveryZones={deliveryZones}
          initialData={{
            name: product.name,
            price: product.price,
            description: product.description,
            images: product.images,
            tags: product.tags,
          }}
        />
      </div>
    </div>
  );
}
