import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { QrCode, CreditCard } from "lucide-react";
import Link from "next/link";
import { MarketStandQR } from "./MarketStandQR";
import { StripeConnectButton } from "./StripeConnectButton";

interface PaymentTabProps {
  marketStand: {
    id: string;
  } | null;
  stripeConnected: boolean;
}

export function PaymentTab({ marketStand, stripeConnected }: PaymentTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Payment Processing</h2>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md">
              Connect your Stripe account to receive payments directly from customers. Stripe provides secure payment processing and automatic transfers to your bank account.
            </p>
          </div>

          {stripeConnected ? (
            <div className="space-y-4 w-full max-w-md">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                <p className="font-medium">✓ Stripe account connected</p>
                <p className="text-sm mt-1">Your account is ready to receive payments</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md">
              <StripeConnectButton />
              <p className="text-sm text-muted-foreground mt-4">
                You&apos;ll be redirected to Stripe to complete the account setup
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Market Stand QR Code</h2>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md">
              Display this QR code at your market stand. When customers scan it, they&apos;ll be able to view your products and make purchases.
            </p>
          </div>

          {marketStand ? (
            <div className="space-y-6">
              <MarketStandQR marketStandId={marketStand.id} size={200} />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Place this QR code where customers can easily scan it</p>
                <p>• Customers need to scan this to make purchases</p>
                <p>• The QR code helps verify product availability</p>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-muted-foreground">
                Set up your market stand to get your QR code
              </p>
              <Link href="/market-stand/setup" className="inline-block mt-4">
                <Button variant="secondary" size="sm">
                  Set Up Market Stand
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
