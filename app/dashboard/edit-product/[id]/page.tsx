import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../../../../lib/db";
import { redirect } from "next/navigation";
import { SellForm } from "../../../../components/form/Sellform";

async function getData(id: string, userId: string) {
  const data = await prisma.product.findUnique({
    where: {
      id,
      userId, // Ensure user owns the product
    },
    select: {
      name: true,
      description: true,
      price: true,
      images: true,
      marketStandId: true,
      inventory: true,
      inventoryUpdatedAt: true,
    },
  });

  return data;
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return redirect("/");
  }

  const data = await getData(params.id, user.id);

  if (!data) {
    return redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-8">Edit Product</h1>
      <SellForm 
        initialData={data}
        productId={params.id}
      />
    </div>
  );
}
