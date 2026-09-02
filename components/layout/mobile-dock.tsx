"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, List, LogOut, Search, User } from "lucide-react";
import { handleSignOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import {
  guestNavItems,
  libraryNavItems,
  profileNavItems,
} from "@/components/layout/nav-items";

interface MobileDockProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

export function MobileDock({ user }: MobileDockProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  const getActiveView = () => {
    if (pathname.startsWith("/messages")) return "messages";
    if (pathname.startsWith("/feed")) return "feed";
    if (pathname.startsWith("/explore") || pathname.startsWith("/search")) return "explore";
    if (pathname.startsWith("/profile")) return "profile";
    return "home";
  };

  const activeView = getActiveView();
  const closeMenus = () => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <>
      {(menuOpen || profileMenuOpen) && (
        <div
          className="fixed inset-0 z-[199] bg-slate-950/55 backdrop-blur-sm animate-in fade-in duration-300 sm:hidden"
          onClick={closeMenus}
          aria-hidden="true"
        />
      )}

      <nav className="fixed inset-x-3 bottom-3 z-[200] flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#0b1220]/88 px-3 py-2 shadow-[0_18px_55px_rgba(0,0,0,0.7)] backdrop-blur-2xl ring-1 ring-white/5 sm:hidden pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="relative mx-auto flex w-full max-w-[25rem] items-center justify-between">
          <button
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-90",
              menuOpen ? "bg-primary/10 text-primary shadow-inner" : "text-slate-400"
            )}
            onClick={() => {
              setMenuOpen((value) => !value);
              setProfileMenuOpen(false);
            }}
            aria-label="Ekranım"
          >
            <List size={20} strokeWidth={2.5} />
            <span className="font-hanken text-[9px] font-bold uppercase tracking-wide">Ekranım</span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-[calc(100%+0.75rem)] left-0 z-50 flex w-64 flex-col overflow-hidden rounded-[1.75rem] border border-amber-400/20 bg-[#0b1220]/95 py-3 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 ring-1 ring-white/10">
              <div className="px-4 py-2 mb-1 flex items-center justify-between border-b border-white/5">
                <span className="font-hanken text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  Kütüphanem
                </span>
                <span className="text-[10px] text-neutral-500 font-bold">Listeler</span>
              </div>
              {libraryNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white transition hover:bg-white/5 active:scale-[0.97]"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition-transform active:scale-95", item.iconBgClass, item.iconTextClass)}>
                    <item.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/"
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-90",
              activeView === "home" && !menuOpen && !profileMenuOpen ? "text-primary font-bold" : "text-slate-400"
            )}
            onClick={closeMenus}
          >
            <Home size={20} strokeWidth={activeView === "home" ? 2.5 : 2} />
            <span className="font-hanken text-[9px] font-bold uppercase tracking-wide">Keşfet</span>
          </Link>

          <div className="relative flex h-11 w-11 items-center justify-center">
            <Link
              href="/search"
              className="absolute -top-5 z-[210] flex h-14 w-14 items-center justify-center rounded-[1.35rem] border-[5px] border-[#020617] bg-primary text-slate-950 shadow-[0_12px_32px_rgba(244,193,78,0.34)] transition-all hover:scale-105 active:scale-90"
              onClick={closeMenus}
              aria-label="Ara"
            >
              <Search size={24} strokeWidth={3} />
            </Link>
          </div>

          <Link
            href="/feed"
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-90",
              activeView === "feed" ? "text-primary font-bold" : "text-slate-400"
            )}
            onClick={closeMenus}
          >
            <Compass size={20} strokeWidth={activeView === "feed" ? 2.5 : 2} />
            <span className="font-hanken text-center text-[9px] font-bold uppercase tracking-wide">Akış</span>
          </Link>

          <button
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-90",
              profileMenuOpen ? "bg-primary/10 text-primary shadow-inner" : "text-slate-400"
            )}
            onClick={() => {
              setProfileMenuOpen((value) => !value);
              setMenuOpen(false);
            }}
            aria-label="Profilim"
          >
            {user?.image ? (
              <div
                className={cn(
                  "h-6 w-6 overflow-hidden rounded-full border-2 transition-colors",
                  profileMenuOpen ? "border-primary" : "border-white/20"
                )}
              >
                <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
              </div>
            ) : (
              <User size={20} strokeWidth={profileMenuOpen ? 2.5 : 2} />
            )}
            <span className="font-hanken text-[9px] font-bold uppercase tracking-wide">Profil</span>
          </button>

          {profileMenuOpen && (
            <div className="absolute bottom-[calc(100%+0.75rem)] right-0 z-50 flex w-60 flex-col overflow-hidden rounded-[1.75rem] border border-amber-400/20 bg-[#0b1220]/95 py-3 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 ring-1 ring-white/10">
              {user ? (
                <>
                  <div className="px-4 py-2 mb-1 flex items-center justify-between border-b border-white/5">
                    <span className="font-hanken text-[10px] font-black text-amber-400 uppercase tracking-widest">
                      Hesabım
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold truncate max-w-[100px]">{user.name || "Kullanıcı"}</span>
                  </div>
                  {profileNavItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white transition hover:bg-white/5 active:scale-[0.97]"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", item.iconBgClass, item.iconTextClass)}>
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold tracking-tight">{item.label}</span>
                    </Link>
                  ))}
                  <div className="mx-4 my-2 h-px bg-white/5" />
                  <form action={handleSignOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-400 transition hover:bg-rose-500/10 active:scale-[0.97]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                        <LogOut size={18} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold uppercase tracking-wider text-xs">Çıkış Yap</span>
                    </button>
                  </form>
                </>
              ) : (
                guestNavItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/5 active:scale-95",
                      item.key === "register" ? "text-primary" : "text-white"
                    )}
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.iconBgClass, item.iconTextClass)}>
                      <item.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className={item.key === "register" ? "font-bold uppercase tracking-wide" : "font-bold"}>
                      {item.label}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
