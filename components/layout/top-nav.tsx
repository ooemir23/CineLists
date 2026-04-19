"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  MessageCircle,
  Film,
  Compass,
  List,
  Check,
  Bookmark,
  BarChart3,
  Users,
  Bell,
  Search,
  LogOut
} from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { handleSignOut } from "@/lib/auth-actions";

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBg = 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10';
  const activeColor = 'text-amber-400';
  const inactiveColor = 'text-slate-400 hover:text-white';

  const getActiveView = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/messages")) return "messages";
    if (pathname.startsWith("/feed")) return "feed";
    if (pathname.startsWith("/explore")) return "explore";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/watched")) return "watched";
    if (pathname.startsWith("/watchlist")) return "watchlist";
    if (pathname.startsWith("/stats")) return "stats";
    return "";
  };
  const activeView = getActiveView();

  return (
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
        <div className="flex items-center justify-center gap-1 md:gap-2 lg:gap-4 relative h-full">


          {/* New: İzlenenler */}
          <Link
            href="/watched"
            className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'watched' ? activeColor : inactiveColor}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'watched' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
              <Check size={22} />
            </div>
            <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">İzlenenler</span>
          </Link>

          {/* New: İzlenecekler */}
          <Link
            href="/watchlist"
            className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'watchlist' ? activeColor : inactiveColor}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'watchlist' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
              <Bookmark size={22} />
            </div>
            <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">İzlenecek</span>
          </Link>

          {/* Central Search Button with CORRECTED CURVED TEXT */}
          <div className="flex flex-col items-center justify-center h-full relative px-2 mx-2">
            <Link
              href="/search"
              className="group relative flex items-center justify-center"
              style={{ marginTop: 15 }}
            >
              <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-all duration-500" />

              <div
                className="relative flex items-center justify-center rounded-full border-4 border-slate-950 transition-all duration-500 bg-amber-400 text-slate-950 shadow-xl group-hover:scale-110 group-hover:rotate-3 active:scale-95 z-20"
                style={{ width: 66, height: 66 }}
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
                <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
                  {/* Wider path to accommodate all letters */}
                  <path id="curve-path" d="M 10,15 Q 60,45 110,15" fill="transparent" />
                  <text className="text-[8px] font-black fill-amber-400 tracking-[0.1em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    <textPath href="#curve-path" startOffset="50%" textAnchor="middle">
                      Ara • Keşfet • İzle
                    </textPath>
                  </text>
                </svg>
              </motion.div>
            </Link>
          </div>

          {/* Akış Link */}
          <Link
            href="/feed"
            className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'feed' ? activeColor : inactiveColor}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'feed' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
              <Compass size={22} />
            </div>
            <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">Akış</span>
          </Link>

          {/* New: İstatistikler */}
          <Link
            href="/stats"
            className={`flex flex-col items-center justify-center h-full transition-all duration-200 px-3 group ${activeView === 'stats' ? activeColor : inactiveColor}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${activeView === 'stats' ? 'bg-amber-400/10' : 'group-hover:bg-white/5'}`}>
              <BarChart3 size={22} />
            </div>
            <span className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">İstatistik</span>
          </Link>



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
            <AnimatePresence>
              {profileMenuOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[-1]" onClick={() => setProfileMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-16 right-0 w-56 bg-slate-900/98 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col py-2 z-50 border border-white/10 overflow-hidden"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-white/5 mb-1 bg-white/5">
                          <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-0.5">Aktif Hesap</p>
                          <p className="text-xs text-white font-bold truncate">{user?.name || "Kullanıcı"}</p>
                        </div>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-amber-400/10 transition group" onClick={() => setProfileMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                            <User size={18} className="text-amber-400" />
                          </div>
                          <span className="font-bold">Profilini Gör</span>
                        </Link>
                        <Link href="/messages" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-amber-400/10 transition group" onClick={() => setProfileMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                            <MessageCircle size={18} className="text-amber-400" />
                          </div>
                          <span className="font-bold">Mesajlar</span>
                        </Link>
                        <Link href="/community" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-amber-400/10 transition group" onClick={() => setProfileMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                            <Users size={18} className="text-amber-400" />
                          </div>
                          <span className="font-bold">Topluluk</span>
                        </Link>
                        <div className="h-[1px] bg-white/5 my-1 mx-2" />
                        <form action={handleSignOut}>
                          <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition group text-left">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                              <LogOut size={18} />
                            </div>
                            <span className="font-bold">Oturumu Kapat</span>
                          </button>
                        </form>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-white/5 mb-1 bg-white/5">
                          <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-0.5">Ziyaretçi</p>
                          <p className="text-xs text-white font-bold truncate">Lütfen giriş yapın</p>
                        </div>
                        <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-amber-400/10 transition group" onClick={() => setProfileMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                            <User size={18} className="text-amber-400" />
                          </div>
                          <span className="font-bold">Giriş Yap</span>
                        </Link>
                        <Link href="/register" className="flex items-center gap-3 px-4 py-3 text-sm text-amber-400 hover:bg-amber-400/20 transition group" onClick={() => setProfileMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center group-hover:bg-amber-400/30 transition-colors">
                            <Compass size={18} />
                          </div>
                          <span className="font-black">Kayıt Ol</span>
                        </Link>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </header>
  );
}
