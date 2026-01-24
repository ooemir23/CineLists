import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/auth";
import "./globals.css";
// import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileDock } from "@/components/layout/mobile-dock";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

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
    default: "WatchGo - Film ve Dizi Takip",
    template: "%s | WatchGo"
  },
  description: "Film ve dizileri takip et, arkadaşlarınla paylaş, puanla ve keşfet.",

  // PWA için
  manifest: '/manifest.json',

  // Mobile optimizations
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WatchGo'
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'WatchGo',
    title: 'WatchGo - Film ve Dizi Takip',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-background text-foreground overflow-x-hidden")} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen max-w-[1920px] mx-auto shadow-2xl shadow-black/50">
          <TopNav user={session?.user} />
          <main className="flex-1 pb-24 md:pb-0 min-h-screen relative z-0">
            {children}
          </main>
          <MobileDock />
        </div>
      </body>
    </html>
  );
}
