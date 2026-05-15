"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Film, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationBell } from "./notification-bell";

export function MobileHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[3000] h-16 bg-slate-950/50 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-5 sm:hidden">
      {/* Left Spacer for centering logo if needed, or place notifications here */}
      <div className="w-10" /> 

      {/* Modern Logo Section */}
      <Link
        href="/"
        className="flex items-center group transition-all active:scale-95 cursor-pointer"
        onClick={(e) => {
          window.dispatchEvent(new CustomEvent("close-all-overlays"));
          if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      >
        <Image 
          src="/logo.png" 
          alt="CineLists" 
          width={120} 
          height={40} 
          className="h-8 w-auto object-contain"
          priority
        />
      </Link>

      {/* Right Side Actions */}
      <div className="flex items-center justify-end w-10">
        <NotificationBell />
      </div>
    </header>
  );
}
