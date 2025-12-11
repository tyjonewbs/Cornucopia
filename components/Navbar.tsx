"use client";

import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import Image from "next/image";
import { HeaderSearchBar } from "./HeaderSearchBar";

export function Navbar() {
  return (
    <nav className="bg-[#0B4D2C]">
      <div className="flex h-20 items-center px-4 max-w-7xl mx-auto gap-4">
        <Link href="/" className="flex items-center flex-shrink-0">
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

        {/* Search bar in center */}
        <div className="flex-1 flex justify-center">
          <HeaderSearchBar />
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <NavbarLinks />
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
