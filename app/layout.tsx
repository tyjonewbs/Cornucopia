import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ProductCacheProvider } from "@/components/providers/ProductCacheProvider";
import { EnvProvider } from "@/components/providers/EnvProvider";
import { PHProvider } from "@/components/providers/PostHogProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PHProvider>
            <EnvProvider>
              <SupabaseProvider>
                <ProductCacheProvider>
                  <Navbar />
                  {children}
                  <Toaster />
                  <ServiceWorkerRegistration />
                </ProductCacheProvider>
              </SupabaseProvider>
            </EnvProvider>
          </PHProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
