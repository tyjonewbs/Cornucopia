import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_SECRET_WEBHOOK as string
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "webhook error";
    console.error("Webhook signature verification failed:", errorMessage);
    return new Response(errorMessage, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    }

    case "payment_intent.payment_failed": {
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    }

    case "charge.refunded": {
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    }
  }

  return new Response(null, { status: 200 });
}

/**
 * Handle successful checkout - create orders, transfers, update inventory
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;

  // Prevent duplicate processing
  const existingOrder = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId },
  });
  if (existingOrder) {
    console.log("Order already exists for session:", sessionId);
    return;
  }

  // Load checkout data from DB snapshot (avoids Stripe metadata size limits)
  const checkout = await prisma.pendingCheckout.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (!checkout) {
    console.error("No pending checkout found for session:", sessionId);
    return;
  }

  const userId = checkout.userId;
  const cartId = checkout.cartId;
  const transferGroup = checkout.transferGroup;
  const platformFee = checkout.platformFee;
  const tax = checkout.tax;
  const deliveryFees = checkout.deliveryFees;
  const checkoutSubtotal = checkout.subtotal;

  let items: Array<{
    productId: string;
    prodId: string;
    qty: number;
    price: number;
    sellerId: string;
    fulfillment: string;
    marketStandId?: string;
    deliveryZoneId?: string;
    deliveryId?: string;
    deliveryDate?: string;
    pickupTime?: string;
  }>;

  let transfers: Array<{
    sid: string;
    acct: string;
    amt: number;
    fee: number;
  }>;

  try {
    items = checkout.items as typeof items;
    transfers = checkout.transfers as typeof transfers;
  } catch {
    console.error("Failed to parse checkout data for session:", sessionId);
    return;
  }

  // Group items by market stand for order creation
  const standGroups = new Map<
    string,
    {
      marketStandId: string;
      items: typeof items;
      fulfillment: string;
      deliveryZoneId?: string;
      deliveryId?: string;
      deliveryDate?: string;
      pickupTime?: string;
    }
  >();

  for (const item of items) {
    const standId = item.marketStandId || "direct";
    if (!standGroups.has(standId)) {
      standGroups.set(standId, {
        marketStandId: standId,
        items: [],
        fulfillment: item.fulfillment,
        deliveryZoneId: item.deliveryZoneId,
        deliveryId: item.deliveryId,
        deliveryDate: item.deliveryDate,
        pickupTime: item.pickupTime,
      });
    }
    standGroups.get(standId)!.items.push(item);
  }

  // Create orders + decrement inventory in a single transaction
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const standEntries = Array.from(standGroups.entries());

  try {
    await prisma.$transaction(async (tx) => {
      for (const [standId, group] of standEntries) {
        const subtotal = group.items.reduce(
          (sum, item) => sum + item.price * item.qty,
          0
        );
        const orderPlatformFee = Math.floor(
          (subtotal / (checkoutSubtotal || 1)) * platformFee
        );
        const orderTax = Math.floor(
          (subtotal / (checkoutSubtotal || 1)) * tax
        );
        const totalAmount = subtotal + orderTax;

        // Generate order number
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderNumber = `ORD-${timestamp}-${random}`;

        await tx.order.create({
          data: {
            orderNumber,
            userId,
            marketStandId: standId === "direct" ? group.items[0]?.marketStandId || "" : standId,
            type: group.fulfillment === "DELIVERY" ? "DELIVERY" : "PICKUP",
            status: "CONFIRMED",
            paymentStatus: "PAID",
            totalAmount,
            subtotal,
            tax: orderTax,
            fees: deliveryFees,
            platformFee: orderPlatformFee,
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            stripeTransferGroup: transferGroup,
            deliveryAddress: null,
            deliveryZoneId: group.deliveryZoneId || null,
            deliveryId: group.deliveryId || null,
            deliveryDate: group.deliveryDate
              ? new Date(group.deliveryDate)
              : null,
            pickupTime: group.pickupTime ? new Date(group.pickupTime) : null,
            items: {
              create: group.items.map((item) => ({
                productId: item.prodId,
                quantity: item.qty,
                priceAtTime: item.price,
              })),
            },
          },
        });

        // Decrement inventory with floor check to prevent negative values
        for (const item of group.items) {
          const product = await tx.product.findUnique({
            where: { id: item.prodId },
            select: { inventory: true },
          });

          const currentInventory = product?.inventory ?? 0;
          const decrementAmount = Math.min(item.qty, currentInventory);

          if (decrementAmount > 0) {
            await tx.product.update({
              where: { id: item.prodId },
              data: { inventory: { decrement: decrementAmount } },
            });
          }

          if (currentInventory < item.qty) {
            console.error(
              `Insufficient inventory for product ${item.prodId}: has ${currentInventory}, need ${item.qty}`
            );
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to create orders in transaction:", error);
    // Orders failed but payment succeeded - PendingCheckout preserved for recovery
    return;
  }

  // Create Stripe transfers to each seller's connected account
  for (const transfer of transfers) {
    try {
      await stripe.transfers.create({
        amount: transfer.amt,
        currency: "usd",
        destination: transfer.acct,
        transfer_group: transferGroup,
      });
    } catch (error) {
      console.error(
        "Failed to create transfer to seller:",
        transfer.sid,
        error
      );
      // Record transfer failure on the order for later retry/investigation
      try {
        await prisma.order.updateMany({
          where: {
            stripeTransferGroup: transferGroup,
            items: {
              some: {
                product: { userId: transfer.sid },
              },
            },
          },
          data: {
            notes: `TRANSFER FAILED - Seller: ${transfer.sid}, Amount: ${transfer.amt} cents. Needs manual resolution.`,
          },
        });
      } catch (noteError) {
        console.error("Failed to record transfer failure note:", noteError);
      }
    }
  }

  // Clear the user's cart
  if (cartId) {
    try {
      await prisma.cartItem.deleteMany({
        where: { cartId },
      });
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  }

  // Clean up the pending checkout record
  try {
    await prisma.pendingCheckout.delete({
      where: { stripeSessionId: sessionId },
    });
  } catch (error) {
    console.error("Failed to delete pending checkout:", error);
  }
}

/**
 * Handle failed payment - mark order as failed if it exists
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const piId = paymentIntent.id;

  try {
    await prisma.order.updateMany({
      where: { stripePaymentIntentId: piId },
      data: { paymentStatus: "FAILED", status: "CANCELLED" },
    });
  } catch (error) {
    console.error("Failed to update order for failed payment:", piId, error);
  }
}

/**
 * Handle refund - update order payment status
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!piId) return;

  try {
    const isFullRefund = charge.amount_refunded === charge.amount;

    await prisma.order.updateMany({
      where: { stripePaymentIntentId: piId },
      data: {
        paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });
  } catch (error) {
    console.error("Failed to update order for refund:", piId, error);
  }
}
