import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    // 1. Verify user authentication
    const user = await getUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Verify environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return new NextResponse("Server configuration error", { status: 500 });
    }

    // 3. Fetch user's connected account ID
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { connectedAccountId: true },
    });

    if (!userData?.connectedAccountId) {
      const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/billing`);
      redirectUrl.searchParams.set("stripe", "error");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // 4. Verify the Stripe account actually completed onboarding
    try {
      const account = await stripe.accounts.retrieve(userData.connectedAccountId);

      if (!account.details_submitted || !account.charges_enabled) {
        // User returned from Stripe but didn't finish onboarding
        const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/billing`);
        redirectUrl.searchParams.set("stripe", "incomplete");
        return NextResponse.redirect(redirectUrl.toString());
      }

      // 5. Account verified - mark as linked
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectedLinked: true },
      });

      const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
      redirectUrl.searchParams.set("stripe", "success");
      return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Failed to verify Stripe account:", error);
      const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/billing`);
      redirectUrl.searchParams.set("stripe", "error");
      return NextResponse.redirect(redirectUrl.toString());
    }
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
