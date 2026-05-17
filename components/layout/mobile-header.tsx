"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { BrandLogo } from "./brand-logo";

export function MobileHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[3000] h-14 px-3 pt-2 sm:hidden pointer-events-none safe-area-top">
      <div className="pointer-events-auto flex h-12 items-center justify-between rounded-[1.35rem] border border-white/10 bg-[#0b1220]/82 px-3 shadow-[0_14px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-white/5">
      <div className="w-9" />

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
      <div className="flex w-9 items-center justify-end">
        <NotificationBell />
      </div>
      </div>
    </header>
  );
}
