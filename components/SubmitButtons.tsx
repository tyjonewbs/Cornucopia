"use client";

import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function Submitbutton({ title, disabled }: { title: string; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending || disabled ? (
        <Button 
          disabled={true}
          aria-label="Form submission in progress"
          className="min-w-[100px]"
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </Button>
      ) : (
        <Button 
          type="submit"
          aria-label={title}
          className="min-w-[100px]"
        >
          {title}
        </Button>
      )}
    </>
  );
}

export function BuyButton({ price }: { price: number }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        <Button 
          disabled 
          size="lg" 
          className="w-full mt-10"
          aria-label="Purchase in progress"
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </Button>
      ) : (
        <Button 
          type="submit" 
          size="lg" 
          className="w-full mt-10"
          aria-label={`Buy for ${(price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
        >
          Buy for {(price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </Button>
      )}
    </>
  );
}
