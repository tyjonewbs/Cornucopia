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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Check if user already has a Stripe account
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { connectedAccountId: true }
      });

      if (existingUser?.connectedAccountId) {
        return new NextResponse("Stripe account already connected", { status: 400 });
      }
    } catch {
      return new NextResponse("Database error", { status: 500 });
    }

    // 3. Verify environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
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
    } catch {
      return new NextResponse("Failed to create Stripe account", { status: 500 });
    }

    // 5. Update user with connected account ID
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { connectedAccountId: account.id }
      });
    } catch {
      // Try to clean up the created Stripe account
      try {
        await stripe.accounts.del(account.id);
      } catch {
        // If cleanup fails, we still want to return the error for the update operation
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
    } catch {
      return new NextResponse("Failed to create onboarding link", { status: 500 });
    }
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
