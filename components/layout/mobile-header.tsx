"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { BrandLogo } from "./brand-logo";

export function MobileHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[3000] h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.55)] flex items-center justify-between px-4 sm:hidden">
      <div className="w-10" />

      <BrandLogo
        href="/"
        size="sm"
        className="justify-center"
        onClick={(e) => {
          window.dispatchEvent(new CustomEvent("close-all-overlays"));
          if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      {/* Right Side Actions */}
      <div className="flex items-center justify-end w-10">
        <NotificationBell />
      </div>
    </header>
  );
}
