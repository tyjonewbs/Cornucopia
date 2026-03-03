/**
 * Platform fee configuration and calculation utilities
 * Used for Stripe Connect marketplace payments
 */

/** Platform fee as a percentage (e.g., 5 = 5%) */
export const PLATFORM_FEE_PERCENT = 5;

/**
 * Calculate the platform fee for a given amount
 * @param amountInCents - The total amount in cents
 * @returns The platform fee in cents (rounded down)
 */
export function calculatePlatformFee(amountInCents: number): number {
  return Math.floor(amountInCents * (PLATFORM_FEE_PERCENT / 100));
}

/**
 * Per-seller breakdown for transfers after a successful payment
 */
export interface SellerTransfer {
  sellerId: string;
  connectedAccountId: string;
  amount: number; // cents - what the seller receives
  platformFee: number; // cents - platform's cut from this seller
  subtotal: number; // cents - gross amount before fee
}

/**
 * Calculate per-seller transfer amounts from cart items
 * Each seller's items are grouped, platform fee is deducted proportionally
 */
export function calculateSellerTransfers(
  items: Array<{
    sellerId: string;
    connectedAccountId: string;
    price: number; // cents per unit
    quantity: number;
  }>
): SellerTransfer[] {
  // Group items by seller
  const sellerMap = new Map<string, { connectedAccountId: string; subtotal: number }>();

  for (const item of items) {
    const existing = sellerMap.get(item.sellerId);
    const itemTotal = item.price * item.quantity;

    if (existing) {
      existing.subtotal += itemTotal;
    } else {
      sellerMap.set(item.sellerId, {
        connectedAccountId: item.connectedAccountId,
        subtotal: itemTotal,
      });
    }
  }

  // Calculate transfers with platform fee deducted
  const transfers: SellerTransfer[] = [];

  const entries = Array.from(sellerMap.entries());
  for (const [sellerId, data] of entries) {
    const platformFee = calculatePlatformFee(data.subtotal);
    transfers.push({
      sellerId,
      connectedAccountId: data.connectedAccountId,
      amount: data.subtotal - platformFee,
      platformFee,
      subtotal: data.subtotal,
    });
  }

  return transfers;
}
