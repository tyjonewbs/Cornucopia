import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-8xl font-bold text-[#0B4D2C]">404</h1>
          <h2 className="text-3xl font-semibold">Looks like this page wandered off...</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We couldn't find what you were looking for. The page might have been moved, deleted, or perhaps it never existed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="bg-[#0B4D2C] hover:bg-[#0B4D2C]/90">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/market-stand/grid" className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Browse Market Stands
            </Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>
            Need help? <Link href="/contact" className="text-[#0B4D2C] hover:underline">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
