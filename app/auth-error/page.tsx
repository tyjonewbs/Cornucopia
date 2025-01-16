"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const errorMessages = {
  no_code: "Authentication code was not provided",
  session_error: "There was an error with your session",
  verification_error: "Could not verify your authentication status",
  no_session: "Unable to create a session",
  unexpected: "An unexpected error occurred",
};

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  const error = searchParams.get("error") || "unexpected";
  const message = searchParams.get("message");

  useEffect(() => {
    // Auto-redirect after 5 seconds
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/");
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="max-w-md space-y-6 px-4">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        
        <p className="text-muted-foreground">
          {errorMessages[error as keyof typeof errorMessages]}
          {message && (
            <span className="block mt-2 text-sm text-destructive">
              Details: {decodeURIComponent(message)}
            </span>
          )}
        </p>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Redirecting to home in {countdown} seconds...
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              Return Home
            </Button>
            <Button
              onClick={() => {
                router.push("/?retry=true");
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
