
import Link from "next/link";
import { Home, Search, Heart, Check, Activity, Bell, Users, MessageSquare, BarChart3, User, Bookmark } from "lucide-react";
import Image from "next/image";
import NavIconLink from "./NavIconLink";

export function TopNav({ user }: { user?: { name?: string | null; image?: string | null } }) {
  return (
    <header className="hidden sm:flex w-full bg-card/80 backdrop-blur-xl border-b border-white/10 items-center justify-between px-6 md:px-10 h-16 z-50 sticky top-0">
      <div className="flex items-center gap-6 min-w-0">
        {/* Desktop: Show WatchGo logo and full nav */}
        <Link href="/" className="hidden sm:flex items-center gap-1 font-bold text-2xl text-white whitespace-nowrap">
          <span className="text-primary">WatchGo</span>
        </Link>
        <nav className="flex gap-1 md:gap-4 flex-wrap">
          {/* Minimal: Only icons on mobile, readable labels on desktop; hide all on mobile */}
          <div className="hidden sm:flex gap-1 md:gap-4">
            <NavIconLink href="/watchlist" label={<span className="text-base font-semibold tracking-tight">İzlenecekler</span>}>
              <Bookmark />
            </NavIconLink>
            <NavIconLink href="/watched" label={<span className="text-base font-semibold tracking-tight">İzlenenler</span>}>
              <Check />
            </NavIconLink>
            <NavIconLink href="/feed" label={<span className="text-base font-semibold tracking-tight">Akış</span>}>
              <Activity />
            </NavIconLink>
            <NavIconLink href="/stats" label={<span className="text-base font-semibold tracking-tight">İstatistikler</span>}>
              <BarChart3 />
            </NavIconLink>
          </div>
        </nav>
        {/* Mobile: Show İzlenecekler, İzlenenler, İstatistikler only on mobile, if needed */}
        {/*
        <nav className="flex gap-2 md:gap-4 flex-wrap sm:hidden">
          <Link href="/watchlist" className="flex items-center gap-1 text-white px-2 py-2 rounded hover:bg-white/10 transition text-xs">
            <Heart className="w-5 h-5" /> İzlenecekler
          </Link>
          <Link href="/watched" className="flex items-center gap-1 text-white px-2 py-2 rounded hover:bg-white/10 transition text-xs">
            <Check className="w-5 h-5" /> İzlenenler
          </Link>
          <Link href="/stats" className="flex items-center gap-1 text-white px-2 py-2 rounded hover:bg-white/10 transition text-xs">
            <BarChart3 className="w-5 h-5" /> İstatistikler
          </Link>
        </nav>
        */}
      </div>
      <div className="flex items-center gap-1 md:gap-3">
        <Link href="/notifications" className="flex items-center justify-center text-white hover:bg-white/10 transition rounded-full p-2">
          <Bell className="w-6 h-6 md:w-7 md:h-7 text-primary" />
        </Link>
        <Link href="/community" className="flex items-center justify-center text-white hover:bg-white/10 transition rounded-full p-2">
          <Users className="w-6 h-6 md:w-7 md:h-7 text-primary" />
        </Link>
        <Link href="/messages" className="flex items-center justify-center text-white hover:bg-white/10 transition rounded-full p-2">
          <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-primary" />
        </Link>
        <Link href="/search" className="hidden sm:flex bg-gradient-to-tr from-primary to-amber-400 shadow-lg rounded-full p-3 md:p-4 items-center justify-center hover:scale-110 transition-transform duration-200 border-4 border-card mx-2 mt-2" style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}>
          <Search className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow" />
        </Link>
        <Link href="/profile" className="ml-2 flex items-center gap-2">
          {user?.image ? (
            <Image src={user.image} alt={user.name || "Profil"} width={36} height={36} className="rounded-full object-cover border-2 border-primary" />
          ) : (
            <User className="w-8 h-8 text-primary" />
          )}
        </Link>
      </div>
    </header>
  );
}
