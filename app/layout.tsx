import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/auth";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WatchGo",
  description: "Dizi ve Film Takip Platformu",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="tr" className="dark">
      <body className={cn(inter.className, "bg-background text-foreground overflow-x-hidden")}>
        <div className="flex min-h-screen">
          <Sidebar user={session?.user} />
          <main className="flex-1 md:pl-64 pb-20 md:pb-0 min-h-screen relative z-0">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
