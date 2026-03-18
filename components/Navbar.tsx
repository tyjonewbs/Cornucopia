"use client";

import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import { CartBadge } from "./CartBadge";
import Image from "next/image";
import { HeaderSearchBar } from "./HeaderSearchBar";

export function Navbar() {
  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-[#0B4D2C] shadow-md">
      <div className="flex h-14 md:h-20 items-center px-3 md:px-4 max-w-7xl mx-auto gap-2 md:gap-4">
        {/* Logo - icon on mobile, full wordmark on desktop */}
        <Link href="/" className="flex items-center flex-shrink-0">
          {/* Mobile: icon only */}
          <div className="relative w-[44px] h-[44px] md:hidden">
            <Image
              src="/logos/cornucopia-mountain-tree.svg"
              alt="Cornucopia"
              fill
              priority
            />
          </div>
          {/* Desktop: full wordmark */}
          <div className="relative hidden md:block w-[110px] h-[74px]">
            <Image
              src="/logos/cornucopia-dark.svg"
              alt="Cornucopia"
              fill
              priority
            />
          </div>
        </Link>

        {/* Search bar - full width on mobile, expands to fill space on desktop */}
        <div className="flex-1 min-w-0">
          <HeaderSearchBar />
        </div>

        {/* Desktop navigation + user nav - hidden on mobile, fixed to right */}
        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <NavbarLinks />
          <CartBadge />
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
