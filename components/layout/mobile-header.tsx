"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
        className="flex items-center gap-2.5 group transition-all active:scale-95 cursor-pointer"
        onClick={(e) => {
          window.dispatchEvent(new CustomEvent("close-all-overlays"));
          if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      >
        <div className="relative">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-amber-400/20 blur-lg rounded-full" />
          
          <div className="relative w-9 h-9 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-3 group-active:rotate-0 transition-transform">
            <Film size={20} className="text-slate-950" strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tighter text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">cine</span>
            lists
          </span>
          <div className="h-0.5 w-full bg-gradient-to-r from-amber-400/50 to-transparent rounded-full mt-0.5 opacity-50" />
        </div>
      </Link>

      {/* Right Side Actions */}
      <div className="flex items-center justify-end w-10">
        <NotificationBell />
      </div>
    </header>
  );
}
