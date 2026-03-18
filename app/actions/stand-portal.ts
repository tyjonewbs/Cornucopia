'use server';

import prisma from "@/lib/db";
import { getUser } from "@/app/actions/auth";
import { stripe } from "@/lib/stripe";
import { calculatePlatformFee, calculateSellerTransfers } from "@/lib/stripe/fees";
import { OrderType, PaymentStatus, OrderStatus } from "@prisma/client";

/**
 * Get stand data for the QR portal
 * Returns stand info, products with inventory, and isOpen status
 */
export async function getStandPortalData(standId: string) {
  try {
    // Fetch stand with products
    const stand = await prisma.marketStand.findUnique({
      where: { id: standId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            connectedAccountId: true,
            stripeConnectedLinked: true,
          },
        },
        productListings: {
          where: {
            isActive: true,
            status: 'APPROVED',
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                inventory: true,
                isActive: true,
                status: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!stand) {
      return { error: "Stand not found" };
    }

    // Filter products to only show those with inventory
    const productsWithInventory = stand.productListings
      .filter((listing) => {
        const inventory = listing.customInventory ?? listing.product.inventory;
        return inventory > 0 && listing.product.isActive && listing.product.status === 'APPROVED';
      })
      .map((listing) => ({
        id: listing.product.id,
        name: listing.product.name,
        price: listing.customPrice ?? listing.product.price,
        images: listing.product.images,
        description: listing.product.description,
        inventory: listing.customInventory ?? listing.product.inventory,
        listingId: listing.id,
      }));

    return {
      stand: {
        id: stand.id,
        name: stand.name,
        description: stand.description,
        locationName: stand.locationName,
        isOpen: stand.isOpen,
        userId: stand.userId,
      },
      products: productsWithInventory,
      seller: {
        connectedAccountId: stand.user.connectedAccountId,
        stripeConnectedLinked: stand.user.stripeConnectedLinked,
      },
    };
  } catch (error) {
    console.error("Error fetching stand portal data:", error);
    return { error: "Failed to load stand data" };
  }
}

/**
 * Toggle stand open/close status (owner only)
 */
export async function toggleStandOpen(standId: string): Promise<{ isOpen?: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user || !user.id) {
      return { error: "Unauthorized" };
    }

    // Verify ownership
    const stand = await prisma.marketStand.findUnique({
      where: { id: standId },
      select: { userId: true, isOpen: true },
    });

    if (!stand) {
      return { error: "Stand not found" };
    }

    if (stand.userId !== user.id) {
      return { error: "You don't own this stand" };
    }

    // Toggle the stand
    const now = new Date();
    const updatedStand = await prisma.marketStand.update({
      where: { id: standId },
      data: {
        isOpen: !stand.isOpen,
        openedAt: !stand.isOpen ? now : undefined,
        closedAt: stand.isOpen ? now : undefined,
        lastCheckedIn: now,
      },
      select: { isOpen: true },
    });

    return { isOpen: updatedStand.isOpen };
  } catch (error) {
    console.error("Error toggling stand:", error);
    return { error: "Failed to toggle stand" };
  }
}

/**
 * Record a cash purchase and decrement inventory
 * Creates an order record for tracking
 */
export async function recordCashPurchase(data: {
  standId: string;
  items: Array<{ productId: string; quantity: number; priceAtTime: number; listingId?: string }>;
}): Promise<{ success?: boolean; orderId?: string; error?: string }> {
  try {
    const user = await getUser();
    if (!user || !user.id) {
      return { error: "You must be logged in to make a purchase" };
    }

    // Verify stand is open
    const stand = await prisma.marketStand.findUnique({
      where: { id: data.standId },
      select: { isOpen: true, userId: true, name: true },
    });

    if (!stand) {
      return { error: "Stand not found" };
    }

    if (!stand.isOpen) {
      return { error: "This stand is currently closed" };
    }

    // Validate inventory and calculate totals
    let subtotal = 0;
    const itemsData: Array<{
      listingId: string;
      productId: string;
      quantity: number;
      priceAtTime: number;
      currentInventory: number;
      useCustomInventory: boolean;
    }> = [];

    for (const item of data.items) {
      // Check if there's a ProductStandListing
      const listing = await prisma.productStandListing.findFirst({
        where: {
          productId: item.productId,
          marketStandId: data.standId,
        },
        include: {
          product: {
            select: {
              inventory: true,
              name: true,
            },
          },
        },
      });

      if (!listing) {
        return { error: `Product not found at this stand` };
      }

      const availableInventory = listing.customInventory ?? listing.product.inventory;
      if (availableInventory < item.quantity) {
        return { error: `Not enough ${listing.product.name} in stock` };
      }

      subtotal += item.priceAtTime * item.quantity;
      itemsData.push({
        listingId: listing.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        currentInventory: availableInventory,
        useCustomInventory: listing.customInventory !== null,
      });
    }

    // Create order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          marketStandId: data.standId,
          type: OrderType.QR_PURCHASE,
          status: OrderStatus.COMPLETED,
          paymentStatus: PaymentStatus.CASH,
          subtotal,
          totalAmount: subtotal,
          tax: 0,
          fees: 0,
          platformFee: 0,
          items: {
            create: itemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime,
              listingId: item.listingId,
            })),
          },
        },
      });

      // Decrement inventory for each item
      for (const item of itemsData) {
        if (item.useCustomInventory) {
          // Decrement custom inventory on the listing
          await tx.productStandListing.update({
            where: { id: item.listingId },
            data: {
              customInventory: { decrement: item.quantity },
            },
          });
        } else {
          // Decrement product inventory
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventory: { decrement: item.quantity },
            },
          });
        }
      }

      return order;
    });

    return { success: true, orderId: result.id };
  } catch (error) {
    console.error("Error recording cash purchase:", error);
    return { error: "Failed to record purchase" };
  }
}

/**
 * Create a Stripe checkout session for card purchases at the QR portal
 */
export async function createQRCheckoutSession(data: {
  standId: string;
  items: Array<{ productId: string; quantity: number; listingId?: string }>;
}): Promise<{ url?: string; error?: string }> {
  try {
    const user = await getUser();
    if (!user || !user.id) {
      return { error: "You must be logged in to checkout" };
    }

    // Verify stand is open
    const stand = await prisma.marketStand.findUnique({
      where: { id: data.standId },
      include: {
        user: {
          select: {
            connectedAccountId: true,
            stripeConnectedLinked: true,
          },
        },
      },
    });

    if (!stand) {
      return { error: "Stand not found" };
    }

    if (!stand.isOpen) {
      return { error: "This stand is currently closed" };
    }

    if (!stand.user.stripeConnectedLinked || !stand.user.connectedAccountId) {
      return { error: "This stand cannot accept card payments at this time" };
    }

    // Fetch products and validate inventory
    const lineItems = [];
    let subtotal = 0;
    const itemsForTransfer = [];

    for (const item of data.items) {
      const listing = await prisma.productStandListing.findFirst({
        where: {
          productId: item.productId,
          marketStandId: data.standId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              inventory: true,
            },
          },
        },
      });

      if (!listing) {
        return { error: `Product not found at this stand` };
      }

      const price = listing.customPrice ?? listing.product.price;
      const inventory = listing.customInventory ?? listing.product.inventory;

      if (inventory < item.quantity) {
        return { error: `Not enough ${listing.product.name} in stock` };
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: listing.product.name,
            images: listing.product.images.slice(0, 1),
          },
          unit_amount: price,
        },
        quantity: item.quantity,
      });

      itemsForTransfer.push({
        sellerId: stand.userId,
        connectedAccountId: stand.user.connectedAccountId!,
        price,
        quantity: item.quantity,
      });
    }

    // Calculate platform fee and transfers
    const platformFee = calculatePlatformFee(subtotal);
    const transfers = calculateSellerTransfers(itemsForTransfer);
    const transferGroup = `qr_purchase_${Date.now()}`;

    // Create Stripe checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/stand-portal/${data.standId}?success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/stand-portal/${data.standId}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        standId: data.standId,
        orderType: "QR_PURCHASE",
        transferGroup,
        platformFee: platformFee.toString(),
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_group: transferGroup,
        metadata: {
          standId: data.standId,
          orderType: "QR_PURCHASE",
        },
      },
    });

    // Store pending checkout data
    await prisma.pendingCheckout.create({
      data: {
        stripeSessionId: session.id,
        userId: user.id,
        cartId: `qr_${data.standId}`, // Placeholder since there's no actual cart
        transferGroup,
        platformFee,
        subtotal,
        tax: 0,
        deliveryFees: 0,
        items: JSON.stringify(
          data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            listingId: item.listingId,
          }))
        ),
        transfers: JSON.stringify(transfers),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return { url: session.url ?? undefined };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: "Failed to create checkout session" };
  }
}

/**
 * Update inventory for a product at a stand (owner only)
 */
export async function updateStandProductInventory(
  standId: string,
  productId: string,
  newInventory: number
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user || !user.id) {
      return { error: "Unauthorized" };
    }

    // Verify ownership
    const stand = await prisma.marketStand.findUnique({
      where: { id: standId },
      select: { userId: true },
    });

    if (!stand) {
      return { error: "Stand not found" };
    }

    if (stand.userId !== user.id) {
      return { error: "You don't own this stand" };
    }

    // Update the listing inventory
    const listing = await prisma.productStandListing.findFirst({
      where: {
        productId,
        marketStandId: standId,
      },
    });

    if (!listing) {
      return { error: "Product listing not found" };
    }

    await prisma.productStandListing.update({
      where: { id: listing.id },
      data: { customInventory: newInventory },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating inventory:", error);
    return { error: "Failed to update inventory" };
  }
}
