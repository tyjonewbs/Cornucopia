import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { QrCode, CreditCard } from "lucide-react";
import Link from "next/link";
import { MarketStandQR } from "./MarketStandQR";
import { StripeConnectButton } from "./StripeConnectButton";

interface PaymentTabProps {
  marketStands: {
    id: string;
    name: string;
  }[];
  stripeConnected: boolean;
}

export function PaymentTab({ marketStands, stripeConnected }: PaymentTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Payment Processing</h2>
            <p className="text-muted-foreground mt-2 mb-4 max-w-md">
              You can list products without connecting a Stripe account, but you&apos;ll need to connect one to receive payments from customers.
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              When connected, Stripe provides secure payment processing and automatic transfers to your bank account.
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
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6">
                <p className="font-medium">Optional Setup</p>
                <p className="text-sm mt-1">
                  You can list products now, but customers won&apos;t be able to make purchases until you connect a Stripe account.
                </p>
              </div>
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
            <h2 className="text-xl font-semibold">Market Stand QR Codes</h2>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md">
              Display these QR codes at your market stands. When customers scan them, they&apos;ll be able to view your products and make purchases once you&apos;ve connected your Stripe account.
            </p>
          </div>

          {marketStands.length > 0 ? (
            <div className="space-y-8 w-full">
              {marketStands.map(stand => (
                <div key={stand.id} className="space-y-4">
                  <h3 className="font-medium">{stand.name}</h3>
                  <div className="flex flex-col items-center space-y-6">
                    <MarketStandQR marketStandId={stand.id} size={200} />
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Place this QR code where customers can easily scan it</p>
                      <p>• Customers need to scan this to make purchases</p>
                      <p>• The QR code helps verify product availability</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-muted-foreground">
                Set up your market stand to get your QR code
              </p>
              <Button 
                variant="secondary" 
                size="sm"
                className="mt-4"
                asChild
                aria-label="Set up your market stand"
              >
                <Link href="/market-stand/setup">
                  Set Up Market Stand
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
