import ProductEmail from "@/components/ProductEmail";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { Resend } from "resend";

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  const body = await req.text();

  const signature = headers().get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_SECRET_WEBHOOK as string
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "webhook error";
    return new Response(errorMessage, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      const link = session.metadata?.link;

      // Only attempt to send email if Resend is initialized
      if (resend) {
        await resend.emails.send({
          from: "MarshalUI <onboarding@resend.dev>",
          to: ["your_email"],
          subject: "Your Product from MarshalUI",
          react: ProductEmail({
            link: link as string,
          }),
        });
      }

      break;
    }
  }

  return new Response(null, { status: 200 });
}
