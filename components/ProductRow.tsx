import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { LoadingProductCard, ProductCard } from "./ProductCard";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryTypes, ProductCategory } from "@/types/category";

async function getData({ category }: ProductCategory) {
  let input: CategoryTypes;
  let title: string;
  let link: string;

  switch (category) {
    case "map": {
      input = CategoryTypes.map;
      title = "Map";
      link = "/products/map";
      break;
    }
    case "how-it-works": {
      input = CategoryTypes.FAQ;
      title = "How it Works";
      link = "/products/how-it-works";
      break;
    }
    case "our-mission": {
      input = CategoryTypes.mission;
      title = "Our Mission";
      link = "/products/our-mission";
      break;
    }
    default: {
      return notFound();
    }
  }

  const data = await prisma.product.findMany({
    where: {
      category: input,
    },
    select: {
      price: true,
      name: true,
      smallDescription: true,
      id: true,
      images: true,
    },
    take: 3,
  });

  return {
    data: data,
    title: title,
    link: link,
  };
}

export function ProductRow({ category }: ProductCategory) {
  return (
    <section className="mt-12">
      <Suspense fallback={<LoadingState />}>
        <LoadRows category={category} />
      </Suspense>
    </section>
  );
}

async function LoadRows({ category }: ProductCategory) {
  const data = await getData({ category: category });
  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-extrabold tracking-tighter ">
          {data.title}
        </h2>
        <Link
          href={data.link}
          className="text-sm hidden font-medium text-primary hover:text-primary/90 md:block"
        >
          All Products <span>&rarr;</span>
        </Link>
      </div>

      <div className="grid gird-cols-1 lg:grid-cols-3 sm:grid-cols-2 mt-4 gap-10">
        {data.data.map((product) => (
          <ProductCard
            images={product.images}
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            smallDescription={product.smallDescription}
          />
        ))}
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 gap-10 lg:grid-cols-3">
        <LoadingProductCard />
        <LoadingProductCard />
        <LoadingProductCard />
      </div>
    </div>
  );
}