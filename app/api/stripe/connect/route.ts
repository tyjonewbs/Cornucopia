import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import Stripe from "stripe";
import { getUser } from "@/lib/auth";

export async function POST() {
  try {
    // 1. Verify user authentication
    const user = await getUser();

    if (!user || !user.id) {
      console.error("[STRIPE_CONNECT_ERROR] User not authenticated");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Check if user already has a Stripe account
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { connectedAccountId: true }
      });

      if (existingUser?.connectedAccountId) {
        console.error("[STRIPE_CONNECT_ERROR] User already has connected account", existingUser.connectedAccountId);
        return new NextResponse("Stripe account already connected", { status: 400 });
      }
    } catch (error) {
      console.error("[STRIPE_CONNECT_ERROR] Database error checking existing account:", error);
      return new NextResponse("Database error", { status: 500 });
    }

    // 3. Verify environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("[STRIPE_CONNECT_ERROR] NEXT_PUBLIC_APP_URL not set");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    // 4. Create Stripe Connect account
    let account: Stripe.Response<Stripe.Account>;
    try {
      account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        tos_acceptance: {
          service_agreement: 'recipient'
        }
      });
    } catch (error) {
      console.error("[STRIPE_CONNECT_ERROR] Failed to create Stripe account:", {
        error,
        user: {
          id: user.id,
          email: user.email,
        },
        requestData: {
          type: "express",
          country: "US",
          email: user.email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          tos_acceptance: {
            service_agreement: 'recipient'
          }
        }
      });
      return new NextResponse("Failed to create Stripe account", { status: 500 });
    }

    // 5. Update user with connected account ID
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { connectedAccountId: account.id }
      });
    } catch (error) {
      console.error("[STRIPE_CONNECT_ERROR] Failed to update user with account ID:", error);
      // Try to clean up the created Stripe account
      try {
        await stripe.accounts.del(account.id);
      } catch (deleteError) {
        console.error("[STRIPE_CONNECT_ERROR] Failed to delete Stripe account after error:", deleteError);
      }
      return new NextResponse("Failed to update user record", { status: 500 });
    }

    // 6. Create account link for onboarding
    try {
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/market-stand/setup`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/success`,
        type: "account_onboarding",
      });

      return NextResponse.json({ url: accountLink.url });
    } catch (error) {
      console.error("[STRIPE_CONNECT_ERROR] Failed to create account link:", error);
      return new NextResponse("Failed to create onboarding link", { status: 500 });
    }
  } catch (error) {
    console.error("[STRIPE_CONNECT_ERROR] Unexpected error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
