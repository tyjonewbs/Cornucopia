import { stripe } from "@/lib/stripe";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { calculatePlatformFee, calculateSellerTransfers } from "@/lib/stripe/fees";
import { groupCartItems, calculateCartTotals } from "@/lib/cart/calculations";
import type { Cart } from "@/types/cart";

export async function POST() {
  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch cart with all items and relations
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
                isActive: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    connectedAccountId: true,
                    stripeConnectedLinked: true,
                  },
                },
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

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 3. Validate cart items (availability + inventory)
    const errors: string[] = [];
    for (const item of cart.items) {
      if (!item.product.isActive || item.product.status !== "APPROVED") {
        errors.push(`${item.product.name} is no longer available`);
      }
      if (item.product.inventory < item.quantity) {
        errors.push(
          `Only ${item.product.inventory} of ${item.product.name} available`
        );
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    }

    // 4. Verify all sellers have connected Stripe accounts
    const sellersWithoutStripe: string[] = [];
    const sellerAccountMap = new Map<string, string>();

    for (const item of cart.items) {
      const seller = (item.product as any).user;
      if (!seller?.connectedAccountId || !seller?.stripeConnectedLinked) {
        sellersWithoutStripe.push(item.product.name);
      } else {
        sellerAccountMap.set(seller.id, seller.connectedAccountId);
      }
    }

    if (sellersWithoutStripe.length > 0) {
      return NextResponse.json(
        {
          error: `The following products cannot be purchased because the seller hasn't set up payments: ${sellersWithoutStripe.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 5. Calculate totals using existing utilities
    const cartForCalc = cart as unknown as Cart;
    const groups = groupCartItems(cartForCalc);
    const totals = calculateCartTotals(cartForCalc);

    // 6. Build line items for Stripe Checkout
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; images?: string[] };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    for (const item of cart.items) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name,
            images:
              item.product.images.length > 0
                ? [item.product.images[0]]
                : undefined,
          },
          unit_amount: item.product.price,
        },
        quantity: item.quantity,
      });
    }

    // Add delivery fees as line items
    for (const group of groups) {
      if (group.type === "DELIVERY" && group.deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Delivery Fee - ${group.deliveryZone?.name || "Delivery"}`,
            },
            unit_amount: group.deliveryFee,
          },
          quantity: 1,
        });
      }
    }

    // 7. Calculate platform fee and seller transfer info
    const transferItems = cart.items.map((item) => ({
      sellerId: item.product.userId,
      connectedAccountId: sellerAccountMap.get(item.product.userId)!,
      price: item.product.price,
      quantity: item.quantity,
    }));

    const sellerTransfers = calculateSellerTransfers(transferItems);
    const totalPlatformFee = calculatePlatformFee(totals.subtotal);

    // Generate a transfer group ID for linking payment and transfers
    const transferGroup = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 8. Build snapshot data for webhook processing
    const cartItemsSnapshot = cart.items.map((item) => ({
      productId: item.id,
      prodId: item.productId,
      qty: item.quantity,
      price: item.product.price,
      sellerId: item.product.userId,
      fulfillment: item.fulfillmentType,
      marketStandId: item.marketStandId || undefined,
      deliveryZoneId: item.deliveryZoneId || undefined,
      deliveryDate: item.deliveryDate?.toISOString() || undefined,
      pickupTime: item.pickupTime?.toISOString() || undefined,
    }));

    const sellerTransfersSnapshot = sellerTransfers.map((t) => ({
      sid: t.sellerId,
      acct: t.connectedAccountId,
      amt: t.amount,
      fee: t.platformFee,
    }));

    // 9. Create Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      customer_email: user.email || undefined,
      payment_intent_data: {
        transfer_group: transferGroup,
      },
      metadata: {
        userId: user.id,
        checkoutVersion: "2",
      },
    });

    // 10. Store cart snapshot in DB (avoids Stripe metadata size limits)
    await prisma.pendingCheckout.create({
      data: {
        stripeSessionId: session.id,
        userId: user.id,
        cartId: cart.id,
        transferGroup,
        platformFee: totalPlatformFee,
        subtotal: totals.subtotal,
        tax: totals.tax,
        deliveryFees: totals.deliveryFees,
        items: cartItemsSnapshot,
        transfers: sellerTransfersSnapshot,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
