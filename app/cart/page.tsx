import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { CartView } from "@/components/cart/CartView";
import type { Cart } from "@/types/cart";

export default async function CartPage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              taxCode: true,
              taxable: true,
              inventory: true,
              userId: true,
            },
          },
          deliveryZone: {
            select: {
              id: true,
              name: true,
              deliveryFee: true,
              freeDeliveryThreshold: true,
              minimumOrder: true,
            },
          },
          marketStand: {
            select: {
              id: true,
              name: true,
              locationName: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  });

  return (
    <section className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <CartView cart={(cart as unknown as Cart) || null} />
    </section>
  );
}
