"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Search,
  LogOut,
  List,
  Compass,
} from "lucide-react";
import { handleSignOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import {
  libraryNavItems,
  profileNavItems,
  guestNavItems,
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

  // Determine active view by pathname
  const getActiveView = () => {
    if (pathname.startsWith("/messages")) return "messages";
    if (pathname.startsWith("/feed")) return "feed";
    if (pathname.startsWith("/explore") || pathname.startsWith("/search")) return "explore";
    if (pathname.startsWith("/profile")) return "profile";
    return "home";
  };
  const activeView = getActiveView();

  return (
    <>
      {/* Backdrop for menus */}
      {(menuOpen || profileMenuOpen) && (
        <div
          className="fixed inset-0 z-[199] sm:hidden bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
          onClick={() => { setMenuOpen(false); setProfileMenuOpen(false); }}
          aria-hidden="true"
        />
      )}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-[200] bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-center px-6 py-3 sm:hidden rounded-t-[2.5rem] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]`}
      >
        <div className="w-full max-w-md flex items-center justify-between mx-auto relative">
          {/* Ekranım menü tuşu */}
          <button
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] rounded-2xl transition-all ${menuOpen ? "bg-amber-400/20 text-amber-400" : "text-slate-400"}`}
            onClick={() => { setMenuOpen((v) => !v); setProfileMenuOpen(false); }}
            aria-label="Ekranım"
          >
            <List size={22} strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Ekranım</span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-20 left-0 w-56 bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col py-3 z-50 border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="px-4 py-2 mb-1">
                <span className="text-[10px] font-black text-amber-400/50 uppercase tracking-widest">Kütüphanem</span>
              </div>
              {libraryNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition active:scale-95"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.iconBgClass, item.iconTextClass)}>
                    <item.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold">{item.label}</span>
                </Link>
              ))}
              <div className="h-[1px] bg-white/5 my-2 mx-4" />
            </div>
          )}

          {/* Home tuşu */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] rounded-2xl transition-all ${activeView === 'home' && !menuOpen && !profileMenuOpen ? "text-amber-400" : "text-slate-400"}`}
            onClick={() => { setMenuOpen(false); setProfileMenuOpen(false); }}
          >
            <Home size={22} strokeWidth={activeView === 'home' ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
          </Link>

          {/* Ortadaki arama butonu - Floating Action Button Style */}
          <div className="relative flex items-center justify-center h-12 w-12">
            <Link
              href="/search"
              className="absolute -top-6 flex items-center justify-center h-16 w-16 rounded-full bg-amber-400 text-slate-950 shadow-[0_8px_24px_rgba(251,191,36,0.4)] border-[6px] border-[#101624] transition-all hover:scale-110 active:scale-90 z-[210]"
              onClick={() => { setMenuOpen(false); setProfileMenuOpen(false); }}
            >
              <Search size={28} strokeWidth={3} />
            </Link>
          </div>

          {/* Akış tuşu */}
          <Link
            href="/feed"
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] rounded-2xl transition-all ${activeView === 'feed' ? "text-amber-400" : "text-slate-400"}`}
            onClick={() => { setMenuOpen(false); setProfileMenuOpen(false); }}
          >
            <Compass size={22} strokeWidth={activeView === 'feed' ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-center">Sosyal Akış</span>
          </Link>

          {/* Profilim menü tuşu */}
          <button
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] rounded-2xl transition-all ${profileMenuOpen ? "bg-amber-400/20 text-amber-400" : "text-slate-400"}`}
            onClick={() => { setProfileMenuOpen((v) => !v); setMenuOpen(false); }}
            aria-label="Profilim"
          >
            {user?.image ? (
                <div className={cn("w-6 h-6 rounded-full overflow-hidden border-2 transition-colors", profileMenuOpen ? "border-amber-400" : "border-white/20")}>
                    <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                </div>
            ) : (
                <User size={22} strokeWidth={profileMenuOpen ? 2.5 : 2} />
            )}
            <span className="text-[9px] font-black uppercase tracking-tighter">Profil</span>
          </button>

          {profileMenuOpen && (
            <div className="absolute bottom-20 right-0 w-52 bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col py-3 z-50 border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              {user ? (
                <>
                  {profileNavItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition active:scale-95"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.iconBgClass, item.iconTextClass)}>
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold">{item.label}</span>
                    </Link>
                  ))}
                  <div className="h-[1px] bg-white/5 my-2 mx-4" />
                  <form action={handleSignOut}>
                    <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition active:scale-95">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/5 flex items-center justify-center">
                        <LogOut size={18} strokeWidth={2.5} />
                      </div>
                      <span className="font-black uppercase tracking-tighter">Çıkış Yap</span>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {guestNavItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition active:scale-95",
                        item.key === "register" ? "text-amber-400" : "text-white"
                      )}
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.iconBgClass, item.iconTextClass)}>
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className={item.key === "register" ? "font-black uppercase tracking-tight" : "font-bold"}>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
