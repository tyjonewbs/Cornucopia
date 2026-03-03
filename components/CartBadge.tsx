"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { getCartItemCount } from "@/app/actions/cart";
import { usePathname } from "next/navigation";

export function CartBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    getCartItemCount().then(setCount).catch(() => setCount(0));
  }, [pathname]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative h-8 w-8 text-white hover:text-white/80"
      asChild
    >
      <Link href="/cart" aria-label={`Cart with ${count} items`}>
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
