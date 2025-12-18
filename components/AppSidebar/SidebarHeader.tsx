"use client";

import Link from "next/link";
import Image from "next/image";
import { SidebarHeaderProps } from "./types";

export function SidebarHeader({ href = "/", className = "" }: SidebarHeaderProps) {
  return (
    <div className={`p-4 border-b border-gray-200 ${className}`}>
      <Link href={href} className="block">
        <Image
          src="/logos/cornucopia-dark.svg"
          alt="Cornucopia"
          width={120}
          height={32}
          priority
        />
      </Link>
    </div>
  );
}
