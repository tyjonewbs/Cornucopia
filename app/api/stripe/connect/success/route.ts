import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 1. Verify user authentication
    const user = await getUser();

    if (!user || !user.id) {
      console.error("[STRIPE_CONNECT_SUCCESS_ERROR] User not authenticated");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Verify environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("[STRIPE_CONNECT_SUCCESS_ERROR] NEXT_PUBLIC_APP_URL not set");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    // 3. Update user's Stripe connection status
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectedLinked: true },
        select: { connectedAccountId: true }
      });

      if (!updatedUser.connectedAccountId) {
        console.error("[STRIPE_CONNECT_SUCCESS_ERROR] No connectedAccountId found for user");
        return new NextResponse("Invalid account state", { status: 400 });
      }

      // 4. Redirect back to dashboard with success message
      const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
      redirectUrl.searchParams.set("stripe", "success");
      
      return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("[STRIPE_CONNECT_SUCCESS_ERROR] Failed to update user:", error);
      return new NextResponse("Failed to update account status", { status: 500 });
    }
  } catch (error) {
    console.error("[STRIPE_CONNECT_SUCCESS_ERROR] Unexpected error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
