"use client";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.url) {
        router.push(data.url);
      } else {
        throw new Error("No redirect URL received from Stripe");
      }
    } catch (error) {
        toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to connect Stripe account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConnect}
      disabled={loading}
      className="w-full relative"
      aria-label="Connect Stripe account for payments"
    >
      {loading ? (
        <>
          <span className="opacity-0">Connect Stripe Account</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 border-2 border-current border-r-transparent animate-spin rounded-full" />
          </div>
        </>
      ) : (
        "Connect Stripe Account"
      )}
    </Button>
  );
}
