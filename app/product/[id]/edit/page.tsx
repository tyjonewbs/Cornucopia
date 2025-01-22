import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/db";
import { Card } from "@/components/ui/card";
import { SellForm } from "@/components/form/Sellform";
import { getUser } from "@/lib/auth";

async function getProduct(id: string, userId: string) {
  const product = await prisma.product.findUnique({
    where: {
      id: id,
      userId: userId // Ensure user owns the product
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: true,
      marketStandId: true,
      inventory: true,
      inventoryUpdatedAt: true,
      tags: true,
      marketStand: {
        select: {
          id: true,
          name: true,
          description: true,
          images: true,
          latitude: true,
          longitude: true,
          createdAt: true,
          userId: true
        }
      }
    }
  });
  return product;
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const product = await getProduct(params.id, user.id);

  if (!product) {
    return redirect("/dashboard");
  }

  // Format product data for the form
  const initialData = {
    name: product.name,
    price: product.price / 100, // Convert back to dollars from cents
    description: product.description,
    images: product.images,
    marketStandId: product.marketStandId,
    inventory: product.inventory,
    inventoryUpdatedAt: product.inventoryUpdatedAt,
    tags: product.tags || []
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Card>
        <SellForm 
          marketStand={product.marketStand}
          initialData={initialData}
          productId={product.id}
        />
      </Card>
    </div>
  );
}
