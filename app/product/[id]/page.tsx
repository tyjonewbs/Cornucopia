import { SellProduct } from "../../../app/actions";
import { ProductDescription } from "../../../components/ProductDescription";
import { BuyButton } from "../../../components/SubmitButtons";
import prisma from "../../../lib/db";
import { Button } from "../../../components/ui/button";
import { unstable_noStore as noStore } from "next/cache";
import { MapPin, Package } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "../../../components/ProductCard";
import { InventoryManager } from "../../../components/InventoryManager";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../../components/ui/carousel";
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
      user: {
        select: {
          id: true,
          profileImage: true,
          firstName: true,
        },
      },
      marketStand: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          locationName: true,
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
            },
            take: isQRAccess ? 4 : 0
          }
        }
      }
    },
  });
  return data;
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
  const data = await getData(params.id, isQRAccess);

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
      <Carousel className="lg:row-end-1 lg:col-span-4">
        <CarouselContent>
          {data?.images.map((item, index) => (
            <CarouselItem key={index}>
              <div className="aspect-w-4 aspect-h-3 rounded-lg bg-gray-100 overflow-hidden">
                <Image
                  src={item as string}
                  alt={data?.name || "Product image"}
                  fill
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-16" />
        <CarouselNext className="mr-16" />
      </Carousel>

      <div className="max-w-2xl mx-auto mt-5 lg:max-w-none lg:mt-0 lg:row-end-2 lg:row-span-2 lg:col-span-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          {data?.name}
        </h1>

        <p className="mt-2 text-muted-foreground mb-6">{data?.description}</p>
        <div className="flex flex-col gap-4">
          {isQRAccess ? (
            <form action={async (formData: FormData) => {
              await SellProduct({
                status: undefined,
                message: null
              }, formData);
            }}>
              <input type="hidden" name="id" value={data?.id} />
              <BuyButton price={Number(data?.price)} />
            </form>
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
                href={`/navigate/${data.marketStand.id}`}
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
              Last Updated:
            </h3>
            <h3 className="text-sm font-medium col-span-1">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "long",
              }).format(data?.updatedAt)}
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
                    <p>{data.marketStand.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.marketStand.latitude.toFixed(4)}, {data.marketStand.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10">
          <InventoryManager
            productId={data?.id ?? ""}
            currentInventory={data?.inventory ?? 0}
            lastUpdated={data?.inventoryUpdatedAt ?? null}
            isOwner={data?.userId === data?.user?.id}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto mt-16 lg:max-w-none lg:mt-0 lg:col-span-4">
        <ProductDescription content={descriptionContent} />
      </div>

      {isQRAccess && data?.marketStand?.products && data.marketStand.products.length > 0 && (
        <div className="col-span-7 mt-16">
          <h3 className="text-xl font-semibold mb-6">More from this Market Stand</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.marketStand.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                images={product.images}
                locationName={data.marketStand.locationName}
                updatedAt={product.updatedAt}
                marketStandId={data.marketStand.id}
                isQRAccess={true}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
