/**
 * Cart Calculation Utilities
 * Handles grouping, totals, and tax calculations
 */

import type { 
  Cart, 
  CartItem, 
  CartGroup, 
  CartTotals 
} from '@/types/cart';

/**
 * Group cart items by fulfillment type and date/location
 */
export function groupCartItems(cart: Cart): CartGroup[] {
  const groups: Map<string, CartGroup> = new Map();

  for (const item of cart.items) {
    let key: string;
    let group: Partial<CartGroup>;

    if (item.fulfillmentType === 'DELIVERY') {
      // Group by delivery zone + date
      const dateKey = item.deliveryDate?.toISOString().split('T')[0] || 'unknown';
      key = `delivery-${item.deliveryZoneId}-${dateKey}`;
      
      group = {
        type: 'DELIVERY',
        key,
        deliveryDate: item.deliveryDate || undefined,
        deliveryZone: item.deliveryZone ? {
          id: item.deliveryZone.id,
          name: item.deliveryZone.name,
          deliveryFee: item.deliveryZone.deliveryFee,
          freeDeliveryThreshold: item.deliveryZone.freeDeliveryThreshold,
        } : undefined,
      };
    } else {
      // Group by market stand + pickup time
      const timeKey = item.pickupTime?.toISOString() || 'anytime';
      key = `pickup-${item.marketStandId}-${timeKey}`;
      
      group = {
        type: 'PICKUP',
        key,
        marketStand: item.marketStand ? {
          id: item.marketStand.id,
          name: item.marketStand.name,
          locationName: item.marketStand.locationName,
        } : undefined,
        pickupTime: item.pickupTime || undefined,
      };
    }

    if (!groups.has(key)) {
      groups.set(key, {
        ...group,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0,
      } as CartGroup);
    }

    const existingGroup = groups.get(key)!;
    existingGroup.items.push(item);
  }

  // Calculate totals for each group
  const groupArray = Array.from(groups.values());
  return groupArray.map(group => calculateGroupTotals(group));
}

/**
 * Calculate subtotal, delivery fee, and total for a cart group
 */
function calculateGroupTotals(group: CartGroup): CartGroup {
  // Calculate subtotal
  const subtotal = group.items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );

  // Calculate delivery fee
  let deliveryFee = 0;
  if (group.type === 'DELIVERY' && group.deliveryZone) {
    deliveryFee = group.deliveryZone.deliveryFee;
    
    // Check for free delivery threshold
    if (
      group.deliveryZone.freeDeliveryThreshold &&
      subtotal >= group.deliveryZone.freeDeliveryThreshold
    ) {
      deliveryFee = 0;
    }
  }

  // Tax will be calculated separately via Stripe Tax
  // For now, estimate based on taxable items
  const taxableAmount = group.items
    .filter(item => item.product.taxable)
    .reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  const estimatedTax = Math.round(taxableAmount * 0.08); // 8% estimate

  const total = subtotal + deliveryFee + estimatedTax;

  return {
    ...group,
    subtotal,
    deliveryFee,
    tax: estimatedTax,
    total,
  };
}

/**
 * Calculate overall cart totals
 */
export function calculateCartTotals(cart: Cart): CartTotals {
  const groups = groupCartItems(cart);

  const subtotal = groups.reduce((sum, group) => sum + group.subtotal, 0);
  const deliveryFees = groups.reduce((sum, group) => sum + group.deliveryFee, 0);
  const tax = groups.reduce((sum, group) => sum + group.tax, 0);
  const total = subtotal + deliveryFees + tax;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    deliveryFees,
    tax,
    total,
    itemCount,
  };
}

/**
 * Format price in cents to USD string
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Check if group meets minimum order requirement
 */
export function meetsMinimumOrder(group: CartGroup): {
  meets: boolean;
  minimum?: number;
  current: number;
  shortfall?: number;
} {
  if (group.type === 'DELIVERY' && group.deliveryZone?.minimumOrder) {
    const minimum = group.deliveryZone.minimumOrder;
    const current = group.subtotal;
    const meets = current >= minimum;
    
    return {
      meets,
      minimum,
      current,
      shortfall: meets ? 0 : minimum - current,
    };
  }

  return {
    meets: true,
    current: group.subtotal,
  };
}

/**
 * Check if group qualifies for free delivery
 */
export function qualifiesForFreeDelivery(group: CartGroup): {
  qualifies: boolean;
  threshold?: number;
  current: number;
  needed?: number;
} {
  if (group.type === 'DELIVERY' && group.deliveryZone?.freeDeliveryThreshold) {
    const threshold = group.deliveryZone.freeDeliveryThreshold;
    const current = group.subtotal;
    const qualifies = current >= threshold;
    
    return {
      qualifies,
      threshold,
      current,
      needed: qualifies ? 0 : threshold - current,
    };
  }

  return {
    qualifies: false,
    current: group.subtotal,
  };
}
