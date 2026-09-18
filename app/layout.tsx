import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import "./globals.css";
// import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileDock } from "@/components/layout/mobile-dock";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Pageview } from "@/components/analytics/pageview";
import { isAdminId } from "@/lib/admin/policy";

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

import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { Toaster } from "sonner";
import { getServerLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { RouteProgressBar } from "@/components/ui/route-progress-bar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, locale] = await Promise.all([
    auth(),
    getServerLocale(),
  ]);

  return (
    <html
      lang={locale}
      className={cn("dark", hanken.variable, bricolage.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className={cn("font-hanken bg-background text-foreground overflow-x-hidden")} suppressHydrationWarning>
        <RouteProgressBar />
        <I18nProvider initialLocale={locale}>
          <div className="flex min-h-screen bg-slate-950 text-foreground">
            {/* Left Portal Sidebar (Desktop xl+) */}
            <PortalSidebar user={session?.user} />

            {/* Main Portal View (Topbar + Page Content) */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              <PortalTopbar user={session?.user} isAdmin={isAdminId(session?.user?.id)} />
              {process.env.ANALYTICS_ENABLED === "true" && <Pageview />}
              <main className="flex-1 pb-24 md:pb-12 relative z-0">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <MobileDock user={session?.user} isAdmin={isAdminId(session?.user?.id)} />
              <Toaster theme="dark" position="bottom-right" richColors />
            </div>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
