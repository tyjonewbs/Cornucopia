"use client";

import { Button } from "components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function Submitbutton({ title, disabled }: { title: string; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending || disabled ? (
        <Button disabled={true}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please Wait
        </Button>
      ) : (
        <Button type="submit">{title}</Button>
      )}
    </>
  );
}

export function BuyButton({ price }: { price: number }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        <Button disabled size="lg" className="w-full mt-10">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please Wait
        </Button>
      ) : (
        <Button type="submit" size="lg" className="w-full mt-10">
          Buy for ${price}
        </Button>
      )}
    </>
  );
}
