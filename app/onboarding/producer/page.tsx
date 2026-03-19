import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { ProducerOnboardingWizard } from "./onboarding-client";

export default async function ProducerOnboardingPage() {
  const user = await getUser();

  // Require authentication
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user already has products (is already a producer)
  const existingProducts = await prisma.product.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    take: 1,
  });

  // If user already has products, redirect to products dashboard
  if (existingProducts.length > 0) {
    redirect("/dashboard/products");
  }

  // Get user's existing market stands and delivery zones (if any)
  const [marketStands, deliveryZones] = await Promise.all([
    prisma.marketStand.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        userId: true,
      },
    }),
    prisma.deliveryZone.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        deliveryFee: true,
        zipCodes: true,
        cities: true,
        states: true,
        deliveryDays: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <ProducerOnboardingWizard
        userId={user.id}
        userEmail={user.email ?? ""}
        userFirstName={user.user_metadata?.name?.split(" ")[0] ?? ""}
        userLastName={user.user_metadata?.name?.split(" ")[1] ?? ""}
        userProfileImage={user.user_metadata?.avatar_url ?? ""}
        existingMarketStands={marketStands}
        existingDeliveryZones={deliveryZones}
      />
    </div>
  );
}
