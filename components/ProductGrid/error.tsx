'use client';

import { Button } from "../ui/button";
import { useEffect } from "react";
import { FallbackProps } from "react-error-boundary";

export default function ProductError({ error, resetErrorBoundary }: FallbackProps) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error]);

  return (
    <div className="text-center py-12">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Error Loading Products</h2>
        <p className="text-muted-foreground">
          Sorry, there was a problem loading the products.
        </p>
        <Button 
          onClick={resetErrorBoundary}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
