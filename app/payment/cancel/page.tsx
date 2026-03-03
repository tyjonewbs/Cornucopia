import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CancelRoute() {
  return (
    <section className="w-full min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-[350px]">
        <div className="p-6">
          <div className="w-full flex justify-center">
            <XCircle className="w-12 h-12 rounded-full bg-red-500/30 text-red-500 p-2" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h3 className="text-lg leading-6 font-medium">Payment Canceled</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment was canceled. You haven&apos;t been charged and your
              cart has been preserved.
            </p>

            <div className="mt-6 space-y-3">
              <Button className="w-full" asChild>
                <Link href="/cart">Return to Cart</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
