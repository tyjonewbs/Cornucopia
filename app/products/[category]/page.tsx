import prisma from "../../../lib/db";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { ClientWrapper } from "./ClientWrapper";

async function getData() {
  const data = await prisma.product.findMany({
    select: {
      id: true,
      images: true,
      description: true,
      name: true,
      price: true,
      latitude: true,
      longitude: true,
    },
  });

  return data;
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  noStore();
  const data = await getData();

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {params.category === "map" ? "Products Near You" : "All Products"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {params.category === "map" 
            ? "Find products in your area" 
            : "Browse all available products"}
        </p>
      </div>

      {/* Client Wrapper Component */}
      <ClientWrapper products={data} />
    </section>
  );
}
