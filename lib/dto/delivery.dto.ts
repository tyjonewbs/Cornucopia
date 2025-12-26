/**
 * Data Transfer Objects for Delivery System
 */

import type { DeliveryZone } from "@/types/delivery";
import type { Prisma } from "@prisma/client";

/**
 * Transform Prisma DeliveryZone to client-safe DeliveryZone type
 */
export function toDeliveryZoneDTO(
  zone: Prisma.DeliveryZoneGetPayload<{
    include?: {
      user?: boolean;
      products?: boolean;
    };
  }>
): DeliveryZone {
  return {
    id: zone.id,
    name: zone.name,
    description: zone.description,
    zipCodes: zone.zipCodes,
    cities: zone.cities,
    states: zone.states,
    deliveryFee: zone.deliveryFee,
    freeDeliveryThreshold: zone.freeDeliveryThreshold,
    minimumOrder: zone.minimumOrder,
    deliveryType: (zone as any).deliveryType || 'ONE_TIME',
    deliveryDays: zone.deliveryDays,
    deliveryTimeWindows: zone.deliveryTimeWindows ? JSON.parse(JSON.stringify(zone.deliveryTimeWindows)) : null,
    scheduledDates: (zone as any).scheduledDates ? JSON.parse(JSON.stringify((zone as any).scheduledDates)) : undefined,
    isActive: zone.isActive,
  };
}

/**
 * Transform array of Prisma DeliveryZones
 */
export function toDeliveryZoneDTOs(
  zones: Prisma.DeliveryZoneGetPayload<{
    include?: {
      user?: boolean;
      products?: boolean;
    };
  }>[]
): DeliveryZone[] {
  return zones.map(toDeliveryZoneDTO);
}

/**
 * Check if an address is covered by a delivery zone
 */
export function isAddressInDeliveryZone(
  zone: DeliveryZone,
  address: {
    zipCode?: string;
    city?: string;
    state?: string;
  }
): boolean {
  // Check ZIP code
  if (address.zipCode && zone.zipCodes.length > 0) {
    if (zone.zipCodes.includes(address.zipCode)) {
      return true;
    }
  }

  // Check city (case-insensitive)
  if (address.city && zone.cities.length > 0) {
    const cityLower = address.city.toLowerCase();
    if (zone.cities.some(c => c.toLowerCase() === cityLower)) {
      return true;
    }
  }

  // Check state
  if (address.state && zone.states.length > 0) {
    const stateUpper = address.state.toUpperCase();
    if (zone.states.some(s => s.toUpperCase() === stateUpper)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate delivery fee for an order
 */
export function calculateDeliveryFee(
  zone: DeliveryZone,
  orderSubtotal: number // in cents
): number {
  // Check if order qualifies for free delivery
  if (zone.freeDeliveryThreshold && orderSubtotal >= zone.freeDeliveryThreshold) {
    return 0;
  }

  return zone.deliveryFee;
}

/**
 * Check if order meets minimum for delivery
 */
export function meetsMinimumOrder(
  zone: DeliveryZone,
  orderSubtotal: number // in cents
): boolean {
  if (!zone.minimumOrder) {
    return true; // No minimum required
  }

  return orderSubtotal >= zone.minimumOrder;
}
