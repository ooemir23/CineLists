"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Search,
  Bookmark,
  Check,
  Compass,
  BarChart3,
  LogOut,
  User,
  MessageCircle,
} from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { handleSignOut } from "@/lib/auth-actions";
import {
  libraryNavItems,
  profileNavItems,
  guestNavItems,
} from "@/components/layout/nav-items";

interface TopNavProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    setMounted(true);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBg = 'bg-slate-900/90 backdrop-blur-xl';
  const activeColor = 'text-amber-400';
  const inactiveColor = 'text-slate-400 hover:text-white';

  const getActiveView = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/messages")) return "messages";
    if (pathname.startsWith("/feed")) return "feed";
    if (pathname.startsWith("/search")) return "explore";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/watched")) return "watched";
    if (pathname.startsWith("/watchlist")) return "watchlist";
    if (pathname.startsWith("/achievements")) return "achievements";
    if (pathname.startsWith("/stats")) return "stats";
    return "";
  };
  const activeView = getActiveView();
  const desktopLibraryItems = libraryNavItems.filter((item) => !["watchlist", "watched"].includes(item.key));

  return (
    <>
      <header
        className={`sticky top-0 left-0 w-full z-[1000] ${navBg} hidden sm:flex items-center justify-center px-6 transition-all duration-300`}
        style={{
          boxShadow: isScrolled ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
          height: 72
        }}
      >
        <div className="w-full max-w-7xl flex items-center justify-between relative h-full">

          {/* Logo Section */}
          <div className="flex-1 flex justify-start z-[1001]">
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-2xl text-white group transition-transform hover:scale-105 cursor-pointer"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                <Film size={24} className="text-slate-950" />
              </div>
              <span className="tracking-tighter hidden md:block"><span className="text-amber-400">cine</span>lists</span>
            </Link>
          </div>

          {/* Navigation Middle Group */}
          <div className="flex items-center justify-center relative h-full flex-grow">
            {/* Left Items Wrapper */}
            <div className="flex-1 flex justify-end gap-1 md:gap-2 lg:gap-4">
              {/* İzlenenler */}
              <Link
                href="/watched"
                className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'watched' ? activeColor : inactiveColor}`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'watched' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
                  <Check size={22} />
                </div>
                <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">İzlenenler</span>
              </Link>

              {/* Listem */}
              <Link
                href="/watchlist"
                className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'watchlist' ? activeColor : inactiveColor}`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'watchlist' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
                  <Bookmark size={22} />
                </div>
                <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">Listem</span>
              </Link>
            </div>

            {/* Search/Explore Button (Center) */}
            <div className="flex flex-col items-center justify-center h-full relative px-4 mx-2 flex-shrink-0">
              <Link
                href="/search"
                className="group relative flex items-center justify-center"
                style={{ marginTop: 15 }}
              >
                {/* Glowing Aura Effect */}
                <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className="relative z-10 w-14 h-14 md:w-16 md:h-16 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/20 group-hover:shadow-amber-400/40 group-hover:scale-110 transition-all duration-300 text-slate-950"
                >
                  <Search size={32} strokeWidth={3} />
                </div>

                {/* CURVED TEXT - FIXED TRUNCATION */}
                <motion.div
                  className="absolute -bottom-10 w-40 h-16 pointer-events-none z-30 flex items-center justify-center"
                  initial={{ opacity: 0.8 }}
                  animate={{
                    opacity: [0.8, 1, 0.8],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg viewBox="0 0 160 60" className="w-full h-full overflow-visible">
                    {/* Wider path to accommodate all letters and ensure perfect centering */}
                    <path id="curve-path" d="M 20,15 Q 80,55 140,15" fill="transparent" />
                    <text className="text-[9px] font-black fill-amber-400 tracking-[0.1em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      <textPath href="#curve-path" startOffset="50%" textAnchor="middle">
                        Ara • Keşfet • İzle
                      </textPath>
                    </text>
                  </svg>
                </motion.div>
              </Link>
            </div>

            {/* Right Items Wrapper */}
            <div className="flex-1 flex justify-start gap-1 md:gap-2 lg:gap-4">
              {/* Akış */}
              <Link
                href="/feed"
                className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'feed' ? activeColor : inactiveColor}`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'feed' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
                  <Compass size={22} />
                </div>
                <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">Akış</span>
              </Link>

              {/* İstatistikler */}
              <Link
                href="/stats"
                className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'stats' ? activeColor : inactiveColor}`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'stats' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
                  <BarChart3 size={22} />
                </div>
                <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">İstatistik</span>
              </Link>

              {desktopLibraryItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === item.key ? activeColor : inactiveColor}`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${activeView === item.key ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
                    <item.icon size={22} />
                  </div>
                  <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section - Profile and Utilities */}
          <div className="flex-1 flex justify-end items-center gap-2">
            <NotificationBell />
            <Link href="/messages" className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-all">
              <MessageCircle size={22} />
            </Link>

            <div className="h-8 w-[1px] bg-white/10 mx-1" />

            {/* Profilim Menu - Moved to Right Corner */}
            <div className="relative h-full flex items-center">
              <button
                className={`flex items-center gap-2 h-full transition-all duration-200 px-3 py-1.5 rounded-2xl group ${profileMenuOpen ? 'bg-amber-400/10 text-amber-400' : 'hover:bg-white/5 text-slate-400'}`}
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setMenuOpen(false);
                }}
              >
                <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10 group-hover:border-amber-400/50 transition-colors">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "Profil"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <User size={18} />
                    </div>
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none gap-0.5 text-left">
                  <span className="text-[11px] font-black uppercase tracking-tight text-white">{user?.name?.split(' ')[0] || "Profil"}</span>
                  <span className="text-[9px] font-bold text-slate-500">Hesabım</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Curved Border & Fill */}
        <div className="absolute top-[71px] left-0 w-full flex items-start pointer-events-none overflow-visible">
          <div className="flex-1 h-[1px] bg-white/10" />
          <div className="flex-shrink-0 w-[240px] h-[60px] relative">
            <svg width="240" height="60" viewBox="0 0 240 60" className="overflow-visible">
              {/* Fill Area */}
              <path 
                d="M 0 0 Q 120 70 240 0" 
                fill="#0f172a" 
                className="opacity-95"
              />
              {/* Border Line */}
              <path 
                d="M 0 0 Q 120 70 240 0" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="1.5" 
              />
            </svg>
          </div>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>
      </header>

      <AnimatePresence>
        {profileMenuOpen && mounted && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px] cursor-default"
              onClick={() => setProfileMenuOpen(false)}
            />
            <div className="fixed top-[80px] right-6 z-[9999]">
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="w-60 bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col py-3 border border-white/10 overflow-hidden ring-1 ring-white/10"
              >
                {user ? (
                  <>
                    <div className="px-5 py-4 border-b border-white/5 mb-2 bg-white/5">
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] mb-1">Hesap</p>
                      <p className="text-sm text-white font-black truncate">{user?.name || "Kullanıcı"}</p>
                    </div>
                    {profileNavItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm text-slate-300 hover:text-white hover:bg-amber-400/10 transition-all group"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                          <item.icon size={20} className="text-amber-400" />
                        </div>
                        <span className="font-bold">{item.label}</span>
                      </Link>
                    ))}
                    <div className="h-[1px] bg-white/5 my-2 mx-3" />
                    <form action={handleSignOut}>
                      <button type="submit" className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-all group text-left">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                          <LogOut size={20} />
                        </div>
                        <span className="font-bold">Oturumu Kapat</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="px-5 py-4 border-b border-white/5 mb-2 bg-white/5">
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] mb-1">Ziyaretçi</p>
                      <p className="text-sm text-white font-black truncate">Giriş Yapılmadı</p>
                    </div>
                    {guestNavItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`flex items-center gap-3 px-5 py-3.5 text-sm hover:text-white hover:bg-amber-400/10 transition-all group ${item.key === "register" ? "text-amber-400" : "text-slate-300"}`}
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                          <item.icon size={20} className="text-amber-400" />
                        </div>
                        <span className={item.key === "register" ? "font-black" : "font-bold"}>{item.label}</span>
                      </Link>
                    ))}
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
