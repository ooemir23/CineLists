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
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all",
              menuOpen ? "bg-amber-400/15 text-amber-300 shadow-inner" : "text-slate-400"
            )}
            onClick={() => {
              setMenuOpen((value) => !value);
              setProfileMenuOpen(false);
            }}
            aria-label="Ekranım"
          >
            <List size={20} strokeWidth={2.5} />
            <span className="text-[8px] font-black uppercase tracking-tighter">Ekranım</span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-[4.6rem] left-0 z-50 flex w-60 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1220]/95 py-3 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="px-4 py-2 mb-1">
                <span className="text-[10px] font-black text-amber-400/55 uppercase tracking-widest">
                  Kütüphanem
                </span>
              </div>
              {libraryNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white transition hover:bg-white/5 active:scale-95"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.iconBgClass, item.iconTextClass)}>
                    <item.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/"
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all",
              activeView === "home" && !menuOpen && !profileMenuOpen ? "text-amber-300" : "text-slate-400"
            )}
            onClick={closeMenus}
          >
            <Home size={20} strokeWidth={activeView === "home" ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
          </Link>

          <div className="relative flex h-11 w-11 items-center justify-center">
            <Link
              href="/search"
              className="absolute -top-5 z-[210] flex h-14 w-14 items-center justify-center rounded-[1.35rem] border-[5px] border-[#101624] bg-amber-400 text-slate-950 shadow-[0_12px_32px_rgba(251,191,36,0.34)] transition-all hover:scale-105 active:scale-90"
              onClick={closeMenus}
              aria-label="Ara"
            >
              <Search size={24} strokeWidth={3} />
            </Link>
          </div>

          <Link
            href="/feed"
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all",
              activeView === "feed" ? "text-amber-300" : "text-slate-400"
            )}
            onClick={closeMenus}
          >
            <Compass size={20} strokeWidth={activeView === "feed" ? 2.5 : 2} />
            <span className="text-center text-[8px] font-black uppercase tracking-tighter">Akış</span>
          </Link>

          <button
            className={cn(
              "flex min-h-[50px] min-w-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all",
              profileMenuOpen ? "bg-amber-400/15 text-amber-300 shadow-inner" : "text-slate-400"
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
                  profileMenuOpen ? "border-amber-400" : "border-white/20"
                )}
              >
                <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
              </div>
            ) : (
              <User size={20} strokeWidth={profileMenuOpen ? 2.5 : 2} />
            )}
            <span className="text-[8px] font-black uppercase tracking-tighter">Profil</span>
          </button>

          {profileMenuOpen && (
            <div className="absolute bottom-[4.6rem] right-0 z-50 flex w-56 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1220]/95 py-3 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              {user ? (
                <>
                  {profileNavItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white transition hover:bg-white/5 active:scale-95"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.iconBgClass, item.iconTextClass)}>
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold">{item.label}</span>
                    </Link>
                  ))}
                  <div className="mx-4 my-2 h-px bg-white/5" />
                  <form action={handleSignOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-rose-400 transition hover:bg-rose-500/10 active:scale-95"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/5">
                        <LogOut size={18} strokeWidth={2.5} />
                      </div>
                      <span className="font-black uppercase tracking-tighter">Çıkış Yap</span>
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
                      item.key === "register" ? "text-amber-400" : "text-white"
                    )}
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.iconBgClass, item.iconTextClass)}>
                      <item.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className={item.key === "register" ? "font-black uppercase tracking-tight" : "font-bold"}>
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
