'use client';

import { ProductRow } from "@/components/ProductRow";
import useUserLocation from "@/app/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { SerializedProduct } from "./actions/home-products";

interface HomeClientProps {
  initialProducts: SerializedProduct[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <ProductRow 
        title="Local Products" 
        link="/local-spots"
        initialProducts={initialProducts}
      />
    </section>
  );
}
