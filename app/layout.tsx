import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import "./globals.css";
// import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileDock } from "@/components/layout/mobile-dock";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#020617',
}

export const metadata: Metadata = {
  title: {
    default: "cinelists - Film ve Dizi Takip",
    template: "%s | cinelists"
  },
  description: "Film ve dizileri takip et, arkadaşlarınla paylaş, puanla ve keşfet.",

  // PWA için
  manifest: '/manifest.json',

  // Mobile optimizations
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'cinelists'
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'cinelists',
    title: 'cinelists - Film ve Dizi Takip',
    description: 'Film ve dizileri takip et, arkadaşlarınla paylaş',
  },

  // Icons
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="tr"
      className={cn("dark", hanken.variable, bricolage.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className={cn("font-hanken bg-background text-foreground overflow-x-hidden")} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen max-w-[1920px] mx-auto shadow-2xl shadow-black/50 mobile-app-shell">
          <TopNav user={session?.user} />
          <MobileHeader />
          <main className="flex-1 pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-0 pb-28 md:pb-0 relative z-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <MobileDock user={session?.user} />
          <Toaster theme="dark" position="bottom-right" richColors />
        </div>
      </body>
    </html>
  );
}
