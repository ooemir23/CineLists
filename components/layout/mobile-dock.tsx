"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  MessageCircle,
  Film,
  Compass,
  List,
  Check,
  Bookmark,
  BarChart3
} from "lucide-react";

const dockBg = 'bg-slate-900/90 backdrop-blur-xl border-t border-white/10';
const activeColor = 'text-amber-400';
const inactiveColor = 'text-slate-400 hover:text-white';

const navItems = [
  { href: "/", icon: Home, label: "Home", view: "home" },
  { href: "/messages", icon: MessageCircle, label: "Mesaj", view: "messages" },
  { href: "/explore", icon: Compass, label: "Keşfet", view: "explore" },
  { href: "/profile", icon: User, label: "Profil", view: "profile" },
];

export function MobileDock() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  // Determine active view by pathname
  const getActiveView = () => {
    if (pathname.startsWith("/messages")) return "messages";
    if (pathname.startsWith("/feed")) return "feed";
    if (pathname.startsWith("/explore")) return "explore";
    if (pathname.startsWith("/profile")) return "profile";
    return "home";
  };
  const activeView = getActiveView();

  return (
    <nav
      className={`fixed bottom-0 left-0 w-full z-[200] ${dockBg} flex items-center justify-center px-2 py-1 sm:hidden`}
      style={{ boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.7)', minHeight: 64 }}
    >
      <div className="w-full max-w-md flex items-end justify-between mx-auto relative">
        {/* Ekranım menü tuşu */}
        <button
          className={`flex flex-col items-center py-2 ${inactiveColor} focus:outline-none`}
          style={{ minWidth: 48 }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Ekranım"
        >
          <List size={24} />
          <span className="text-[10px] mt-0.5 font-bold">Ekranım</span>
        </button>
        {menuOpen && (
          <div className="absolute bottom-14 left-0 w-40 bg-slate-900/95 rounded-xl shadow-lg flex flex-col py-2 z-50 animate-fade-in-up border border-white/10">
            <Link href="/watched" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setMenuOpen(false)}>
              <Check size={20} /> İzlenenler
            </Link>
            <Link href="/watchlist" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setMenuOpen(false)}>
              <Bookmark size={20} /> İzlenecekler
            </Link>
            <Link href="/stats" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setMenuOpen(false)}>
              <BarChart3 size={20} /> İstatistikler
            </Link>
          </div>
        )}

        {/* Home tuşu */}
        <Link
          href="/"
          className={`flex flex-col items-center py-2 ${activeView === 'home' ? activeColor : inactiveColor}`}
        >
          <Home size={24} />
          <span className="text-[10px] mt-0.5 font-bold">Home</span>
        </Link>

        {/* Ortadaki arama butonu */}
        <div className="flex flex-col items-center" style={{ position: 'relative', zIndex: 10 }}>
          <Link
            href="/search"
            className={`flex items-center justify-center rounded-full border-4 border-slate-900 transition-all duration-200 bg-amber-400 text-slate-950 shadow-lg hover:scale-110 shadow-lg`}
            style={{ width: 64, height: 64, marginTop: -28 }}
          >
            <Film size={32} />
          </Link>
        </div>

        {/* Akış tuşu */}
        <Link
          href="/feed"
          className={`flex flex-col items-center py-2 ${activeView === 'feed' ? activeColor : inactiveColor}`}
        >
          <Compass size={24} />
          <span className="text-[10px] mt-0.5 font-bold">Akış</span>
        </Link>

        {/* Profilim menü tuşu */}
        <button
          className={`flex flex-col items-center py-2 ${inactiveColor} focus:outline-none`}
          style={{ minWidth: 48 }}
          onClick={() => setProfileMenuOpen((v) => !v)}
          aria-label="Profilim"
        >
          <User size={24} />
          <span className="text-[10px] mt-0.5 font-bold">Profilim</span>
        </button>
        {profileMenuOpen && (
          <div className="absolute bottom-14 right-0 w-40 bg-slate-900/95 rounded-xl shadow-lg flex flex-col py-2 z-50 animate-fade-in-up border border-white/10">
            <Link href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setProfileMenuOpen(false)}>
              <User size={20} /> Profil
            </Link>
            <Link href="/messages" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setProfileMenuOpen(false)}>
              <MessageCircle size={20} /> Mesajlar
            </Link>
            <Link href="/community" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setProfileMenuOpen(false)}>
              <Compass size={20} /> Topluluk
            </Link>
            <Link href="/notifications" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-primary/10 transition" onClick={() => setProfileMenuOpen(false)}>
              <List size={20} /> Bildirimler
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
