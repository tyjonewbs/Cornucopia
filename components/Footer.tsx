"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0B4D2C] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Social Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative w-[180px] h-[45px]">
                <Image
                  src="/logos/cornucopia-dark.svg"
                  alt="Cornucopia"
                  fill
                  className="brightness-0 invert"
                />
              </div>
            </Link>
            <p className="text-sm text-gray-300 max-w-sm">
              Your local marketplace for fresh produce and homemade goods. 
              Supporting local farmers and artisans in your community.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-[#0B4D2C]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-[#0B4D2C]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-[#0B4D2C]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-[#0B4D2C]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 text-[#0B4D2C]" />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/our-mission"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Our mission and vision
                </Link>
              </li>
              <li>
                <Link
                  href="/our-team"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Our team
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="border-t border-white/20 pt-6">
          <p className="text-center text-sm text-gray-300">
            Copyright © {new Date().getFullYear()}. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
