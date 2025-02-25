"use client";

import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="bg-[#0B4D2C]">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center">
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

        <NavbarLinks />

        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
