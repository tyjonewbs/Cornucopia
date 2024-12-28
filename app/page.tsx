import { ProductRow } from "../components/ProductRow";
import dynamic from 'next/dynamic';
import prisma from "../lib/db";

const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
});

async function getProducts() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      images: true,
      latitude: true,
      longitude: true,
    },
  });
  return products;
}

export default async function Home() {
  const products = await getProducts();

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <div className="max-w-3xl mx-auto text-2xl sm:text-5xl lg:text-6xl font-semibold text-center">
        <h1>Find the best Tailwind</h1>
        <h1 className="text-primary">Templates & Icons</h1>
        <p className="lg:text-lg text-muted-foreground mx-auto mt-5 w-[90%] font-normal text-base">
          MarshalUi stands out as the premier marketplace for all things related
          to tailwindcss, offering an unparalleled platform for both sellers and
          buyers alike.
        </p>
      </div>
      <div className="mt-8">
        <MapView products={products} />
      </div>
      <ProductRow title="Nearby Products" link="/products" />
    </section>
  );
}
