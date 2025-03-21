import { SellProduct } from "@/app/actions";
import { ProductDescription } from "@/components/ProductDescription";
import { BuyButton } from "@/components/SubmitButtons";
import prisma from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { MapPin, Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { JSONContent } from "@tiptap/react";
import Image from "next/image";

async function getData(id: string, isQRAccess: boolean) {
  const data = await prisma.product.findUnique({
    where: {
      id: id,
    },
    select: {
      description: true,
      name: true,
      images: true,
      price: true,
      updatedAt: true,
      id: true,
      userId: true,
      inventory: true,
      inventoryUpdatedAt: true,
      tags: true,
      user: {
        select: {
          id: true,
          profileImage: true,
          firstName: true,
          connectedAccountId: true,
          stripeConnectedLinked: true,
        },
      },
      marketStand: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          locationName: true,
          createdAt: true,
          products: {
            where: {
              NOT: {
                id: id
              }
            },
            select: {
              id: true,
              name: true,
              images: true,
              updatedAt: true,
              price: true,
              tags: true,
            },
            take: isQRAccess ? 4 : 0
          }
        }
      }
    },
  });

  if (!data) return null;

  // Serialize dates
  return {
    ...data,
    updatedAt: data.updatedAt.toISOString(),
    inventoryUpdatedAt: data.inventoryUpdatedAt?.toISOString() ?? null,
    marketStand: data.marketStand ? {
      ...data.marketStand,
      createdAt: data.marketStand.createdAt.toISOString(),
      products: data.marketStand.products.map(product => ({
        ...product,
        updatedAt: product.updatedAt.toISOString()
      }))
    } : null
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  noStore();
  const isQRAccess = searchParams.qr === 'true';
  const data = await getData(decodeURIComponent(params.id), isQRAccess);

  // Convert string description to JSONContent format
  const descriptionContent: JSONContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: data?.description || ''
          }
        ]
      }
    ]
  };

  return (
    <section className="mx-auto px-4 lg:mt-10 max-w-7xl lg:px-8 lg:grid lg:grid-rows-1 lg:grid-cols-7 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
      <Carousel className="lg:row-end-1 lg:col-span-4 relative group rounded-lg">
        <CarouselContent>
          {data?.images.map((item, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-[4/3] w-full rounded-lg bg-gray-100 overflow-hidden group-hover:shadow-lg transition-all">
                <Image
                  src={item as string}
                  alt={data?.name || "Product image"}
                  fill
                  className="object-cover rounded-lg transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 hover:shadow-lg" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 hover:shadow-lg" />
      </Carousel>

      <div className="max-w-2xl mx-auto mt-5 lg:max-w-none lg:mt-0 lg:row-end-2 lg:row-span-2 lg:col-span-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          {data?.name}
        </h1>

        <div className="mt-2 mb-6 space-y-4">
          <p className="text-xl font-bold">
            ${((data?.price || 0) / 100).toFixed(2)}
          </p>
          {data?.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-secondary px-2 py-1 rounded-md text-xs"
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {isQRAccess ? (
            <>
              {!data?.user?.stripeConnectedLinked && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Payment Not Available</p>
                    <p className="text-sm mt-1">
                      This seller hasn&apos;t set up their payment account yet. You can view the product details, but purchases are temporarily unavailable.
                    </p>
                  </div>
                </div>
              )}
              {data?.user?.stripeConnectedLinked && (
                <form action={async (formData: FormData) => {
                  await SellProduct({
                    status: undefined,
                    message: null
                  }, formData);
                }}>
                  <input type="hidden" name="id" value={data?.id} />
                  <BuyButton price={Number(data?.price)} />
                </form>
              )}
            </>
          ) : data?.marketStand ? (
            <>
              <div className="bg-muted p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Visit Market Stand to Purchase
                </h4>
                <p className="text-muted-foreground">
                  To buy this product, visit the market stand and scan the QR code. This helps ensure the product is still available.
                </p>
              </div>
              <Link 
                href={`/navigate/${encodeURIComponent(data.marketStand.id)}`}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-center"
              >
                <MapPin className="h-4 w-4" />
                Get Directions to Market Stand
              </Link>
            </>
          ) : (
            <div className="bg-destructive/10 p-4 rounded-lg text-sm">
              <h4 className="font-medium mb-2 text-destructive">Product Unavailable</h4>
              <p className="text-muted-foreground">
                This product is not currently available at any market stand.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 mt-10 pt-10">
          <div className="grid grid-cols-2 w-full gap-y-3">
            <h3 className="text-sm font-medium text-muted-foreground col-span-1">
              Member since:
            </h3>
            <h3 className="text-sm font-medium col-span-1">
              {data?.marketStand?.createdAt && new Intl.DateTimeFormat("en-US", {
                dateStyle: "long",
              }).format(new Date(data.marketStand.createdAt))}
            </h3>

            <h3 className="text-sm font-medium text-muted-foreground col-span-1">
              Available at:
            </h3>
            <div className="text-sm font-medium col-span-1 space-y-2">
              {!data?.marketStand ? (
                <p className="text-muted-foreground italic">No market stand available</p>
              ) : (
                <div key={data.marketStand.id} className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{data.marketStand.locationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.marketStand.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="w-full max-w-2xl mx-auto mt-16 lg:max-w-none lg:mt-0 lg:col-span-4">
        <ProductDescription content={descriptionContent} />
      </div>

      {isQRAccess && data?.marketStand?.products && data.marketStand?.products.length > 0 && (
        <div className="col-span-7 mt-16">
          <h3 className="text-xl font-semibold mb-6">More from this Market Stand</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.marketStand?.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                images={product.images}
                locationName={data.marketStand?.locationName ?? ''}
                updatedAt={product.updatedAt}
                isQRAccess={true}
                price={product.price}
                tags={product.tags}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
