import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST() {
  try {
    // 1. Verify user authentication
    const user = await getUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Check if user already has a Stripe account
    let accountId: string | null = null;
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { connectedAccountId: true }
      });
      accountId = existingUser?.connectedAccountId || null;
    } catch (error) {
      console.error("Database error checking existing user:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 3. Verify environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 4. Create Stripe Connect account if one doesn't exist
    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: user.email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;
      } catch (error) {
        console.error("Stripe account creation error:", error);
        const message = error instanceof Error ? error.message : "Failed to create Stripe account";
        return NextResponse.json({ error: message }, { status: 500 });
      }

      // 5. Update user with connected account ID
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { connectedAccountId: accountId }
        });
      } catch (error) {
        console.error("Failed to update user with Stripe account:", error);
        try {
          await stripe.accounts.del(accountId);
        } catch (cleanupError) {
          console.error("Failed to cleanup Stripe account:", cleanupError);
        }
        return NextResponse.json({ error: "Failed to update user record" }, { status: 500 });
      }
    }

    // 6. Create account link for onboarding (works for both new and existing accounts)
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/success`,
        type: "account_onboarding",
      });

      return NextResponse.json({ url: accountLink.url });
    } catch (error) {
      console.error("Failed to create account link:", error);
      const message = error instanceof Error ? error.message : "Failed to create onboarding link";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    console.error("Stripe connect internal error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
