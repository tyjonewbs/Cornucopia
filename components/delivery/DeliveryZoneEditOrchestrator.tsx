"use client";

import { DeliveryZoneForm } from "@/components/form/DeliveryZoneForm";
import { ProductAssociationPanel } from "./ProductAssociationPanel";
import type { DeliveryZone } from "@/types/delivery";

interface ProductWithZoneStatus {
  id: string;
  name: string;
  price: number;
  images: string[];
  inventory: number;
  isInZone: boolean;
}

interface DeliveryZoneEditOrchestratorProps {
  zone: DeliveryZone;
  products: ProductWithZoneStatus[];
}

export function DeliveryZoneEditOrchestrator({
  zone,
  products,
}: DeliveryZoneEditOrchestratorProps) {
  return (
    <div className="space-y-8">
      <DeliveryZoneForm deliveryZone={zone} />
      <ProductAssociationPanel
        zoneId={zone.id}
        zoneName={zone.name}
        products={products}
      />
    </div>
  );
}
