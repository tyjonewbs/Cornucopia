"use client";

import Link from "next/link";
import { NavbarLinks } from "./NavbarLinks";
import { UserNav } from "./UserNav";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center">
          <div className="relative w-[180px] h-[45px]">
            <Image
            src="/logos/cornucopia.svg"
            alt="Cornucopia"
            fill
            priority
            className="block dark:hidden"
          />
          <Image
            src="/logos/cornucopia-dark.svg"
            alt="Cornucopia"
            fill
            priority
            className="hidden dark:block"
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
