"use client";

import { cn } from "../lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const navbarLinks = [
  {
    id: 0,
    name: "Home",
    href: "/",
  },
  {
    id: 1,
    name: "Market Stands",
    href: "/market-stand",
  },
  {
    id: 2,
    name: "How it Works",
    href: "/how-it-works",
  },
  {
    id: 3,
    name: "Our Mission",
    href: "/our-mission",
  },
];

export function NavbarLinks() {
  const location = usePathname();

  return (
    <div className="flex justify-center items-center gap-x-6 ml-10">
      {navbarLinks.map((item) => (
        <Link
          href={item.href}
          key={item.id}
          className={cn(
            location === item.href
              ? "text-white font-medium"
              : "text-white/80 hover:text-white",
            "transition-colors"
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
