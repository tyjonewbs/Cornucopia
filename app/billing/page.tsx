import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";
import { AlertCircle } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";

async function getData(userId: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      stripeConnectedLinked: true,
    },
  });

  return data;
}

export default async function BillingRoute() {
  noStore();
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const data = await getData(user.id);
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Find all your details regarding your payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Payment Integration Temporarily Disabled</p>
              <p className="text-sm mt-1">
                Stripe integration is currently disabled for testing purposes. Payment functionality will be available soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
