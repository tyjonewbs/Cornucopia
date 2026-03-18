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
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
      { url: "/logos/cornucopia-mountain-tree.svg", type: "image/svg+xml", rel: "icon" },
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#0B4D2C] focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
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
                    <div className="mobile-content-wrapper">
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
