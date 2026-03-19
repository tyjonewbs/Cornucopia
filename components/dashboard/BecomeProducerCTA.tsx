"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, TrendingUp } from "lucide-react";

export function BecomeProducerCTA() {
  return (
    <Card className="border-[#8B4513] bg-gradient-to-r from-orange-50 to-amber-50">
      <CardHeader>
        <CardTitle className="text-2xl">Become a Producer</CardTitle>
        <CardDescription className="text-base">
          Start selling your products on Cornucopia! List your first product and reach local customers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-[#8B4513] p-1 mt-0.5">
              <Package className="h-3 w-3 text-white" />
            </div>
            <span>List your products with photos and descriptions</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-[#8B4513] p-1 mt-0.5">
              <Store className="h-3 w-3 text-white" />
            </div>
            <span>Optionally set up your own market stand or list in others</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-[#8B4513] p-1 mt-0.5">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <span>Track sales and manage inventory</span>
          </div>
        </div>
        <Link href="/onboarding/producer">
          <Button className="bg-[#8B4513] hover:bg-[#6B3410] w-full">
            Become a Producer
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
