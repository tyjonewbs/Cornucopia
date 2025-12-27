import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ProductCacheProvider } from "@/components/providers/ProductCacheProvider";
import { EnvProvider } from "@/components/providers/EnvProvider";
import { PHProvider } from "@/components/providers/PostHogProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { LocationProvider } from "@/components/providers/LocationProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B4D2C',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Cornucopia",
  description: "Your local marketplace for fresh produce and homemade goods",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cornucopia",
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/logos/cornucopia-mountain-tree.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [
      { url: "/icons/icon-192x192.png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": "#0B4D2C",
    "msapplication-tap-highlight": "no",
  },
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
                  <LocationProvider>
                    <Navbar />
                    <div className="pb-16 md:pb-0">
                      {children}
                    </div>
                    <div className="hidden md:block">
                      <Footer />
                    </div>
                    <MobileBottomNav />
                    <Toaster />
                    <ServiceWorkerRegistration />
                    <PWAInstallPrompt />
                  </LocationProvider>
                </ProductCacheProvider>
              </SupabaseProvider>
            </EnvProvider>
          </PHProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
