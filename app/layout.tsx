import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Cornucopia",
  description: "Your local marketplace for fresh produce and homemade goods",
  icons: {
    icon: [
      {
        url: "/logos/cornucopia-mountain-tree.svg",
        type: "image/svg+xml",
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <Navbar />
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
