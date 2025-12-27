"use client";

import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import Image from "next/image";
import { HeaderSearchBar } from "./HeaderSearchBar";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0B4D2C] shadow-md">
      <div className="flex h-14 md:h-20 items-center px-3 md:px-4 max-w-7xl mx-auto gap-2 md:gap-4">
        {/* Logo - hidden on mobile, visible on desktop, fixed to left */}
        <Link href="/" className="hidden md:flex items-center flex-shrink-0">
          <div className="relative w-[180px] h-[45px]">
            <Image
              src="/logos/cornucopia-dark.svg"
              alt="Cornucopia"
              fill
              priority
              className="brightness-0 invert"
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
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
