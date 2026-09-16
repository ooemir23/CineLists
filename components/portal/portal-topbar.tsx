"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Film,
  Compass,
  Tv,
  Star,
  ListFilter,
  Users,
  LogIn,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PortalTopbarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const SECTION_TABS = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Keşfet", href: "/search" },
  { label: "Vizyondakiler", href: "/?type=movie" },
  { label: "Popüler Diziler", href: "/?type=tv" },
  { label: "En İyiler", href: "/?category=top_rated" },
  { label: "Listeler", href: "/watchlist" },
  { label: "Topluluk", href: "/community" },
];

export function PortalTopbar({ user }: PortalTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("portal-search-input");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/10 transition-shadow">
      {/* Top Header Row */}
      <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-3 max-w-[1600px] mx-auto">
        {/* Mobile Brand (hidden on xl where sidebar exists) */}
        <div className="flex items-center gap-2 xl:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 md:hidden"
            aria-label="Menüyü aç"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-slate-950 shadow-md shadow-amber-400/20">
              <Film className="w-4 h-4" />
            </div>
            <span className="font-black text-white text-base tracking-tight">
              <span className="text-amber-400">CINE</span>LISTS
            </span>
          </Link>
        </div>

        {/* Smart Search Bar (Desktop & Mobile) */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-2xl relative flex items-center"
        >
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
          <input
            id="portal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Aramak istediğiniz film, dizi, oyuncu veya liste..."
            className="w-full h-10 pl-10 pr-20 rounded-xl bg-white/[0.06] hover:bg-white/[0.08] focus:bg-slate-900 border border-white/10 focus:border-amber-400/60 text-white placeholder-neutral-500 text-xs font-medium focus:outline-none transition-all shadow-inner"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono text-neutral-400 absolute right-3 pointer-events-none">
            Ctrl K
          </kbd>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors relative"
                title="Bildirimler"
              >
                <Bell className="w-4 h-4" />
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden relative bg-amber-400/20 border border-amber-400/40">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "Kullanıcı"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-amber-400 font-black text-xs">
                      {user.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-white max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-slate-950 transition-transform active:scale-95 shadow-md shadow-amber-400/20"
              >
                Üye Ol
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs Bar (Merlin'in Kazanı style horizontal bar) */}
      <div className="px-3 sm:px-6 py-1.5 border-t border-white/5 overflow-x-auto scrollbar-hide bg-slate-950/40">
        <div className="flex items-center gap-1.5 max-w-[1600px] mx-auto">
          {SECTION_TABS.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/" && !searchParams.toString()
                : pathname === tab.href ||
                  (tab.href.includes("?") &&
                    `/?${searchParams.toString()}` === tab.href);

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0",
                  isActive
                    ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
