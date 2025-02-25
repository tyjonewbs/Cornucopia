import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";
import { ProductCatalogList } from "@/components/dashboard/ProductCatalogList";

async function getUserProducts(userId: string) {
  const products = await prisma.product.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      isActive: true,
      marketStand: {
        select: {
          id: true,
          name: true,
        },
      },
      local: {
        select: {
          id: true,
          name: true,
        },
      },
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return products.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images[0] || '',
    isOnline: product.local !== null,
    marketStands: product.marketStand ? [product.marketStand] : [],
    updatedAt: product.updatedAt,
  }));
}

export default async function SellRoute() {
  noStore();
  const user = await getUser();

  if (!user) {
    return redirect('/');
  }

  const products = await getUserProducts(user.id);

  return (
    <div className="space-y-6">
      <ProductCatalogList products={products} />
    </div>
  );
}
