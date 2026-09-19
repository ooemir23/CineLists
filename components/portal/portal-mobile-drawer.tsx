"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  X,
  Home,
  Compass,
  Film,
  Tv,
  ListFilter,
  Users,
  Activity,
  Award,
  Calendar,
  Sparkles,
  Layers,
  Flame,
  ChevronRight,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/layout/language-selector";
import { useTranslation } from "@/lib/i18n/i18n-context";

type PortalMobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string | null;
  };
  isAdmin?: boolean;
};

const PLATFORMS = [
  { id: "8", name: "Netflix", color: "bg-red-500", textColor: "text-red-400" },
  { id: "119", name: "Prime Video", color: "bg-sky-500", textColor: "text-sky-400" },
  { id: "337", name: "Disney+", color: "bg-blue-500", textColor: "text-blue-400" },
  { id: "350", name: "Apple TV+", color: "bg-neutral-400", textColor: "text-neutral-300" },
  { id: "344", name: "BluTV", color: "bg-amber-500", textColor: "text-amber-400" },
  { id: "613", name: "TOD", color: "bg-teal-500", textColor: "text-teal-400" },
];

const GENRES = [
  { id: "28", nameTr: "Aksiyon", nameEn: "Action" },
  { id: "35", nameTr: "Komedi", nameEn: "Comedy" },
  { id: "18", nameTr: "Dram", nameEn: "Drama" },
  { id: "878", nameTr: "Bilim Kurgu", nameEn: "Sci-Fi" },
  { id: "27", nameTr: "Korku", nameEn: "Horror" },
  { id: "16", nameTr: "Animasyon", nameEn: "Animation" },
  { id: "53", nameTr: "Gerilim", nameEn: "Thriller" },
];

export function PortalMobileDrawer({
  isOpen,
  onClose,
  user,
  isAdmin = false,
}: PortalMobileDrawerProps) {
  const { dict, locale } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentProvider = searchParams.get("provider");
  const currentGenre = searchParams.get("genre");

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [pathname, searchParams]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] xl:hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 w-[86vw] max-w-xs bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/40">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="CineLists"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-white text-base tracking-tight">
              <span className="text-amber-400">CINE</span>LISTS
            </span>
          </Link>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card if logged in */}
        {user ? (
          <div className="p-3 border-b border-white/10 bg-white/[0.02]">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-400/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden relative bg-amber-400/20 border border-amber-400/40 shrink-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "Kullanıcı"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-amber-400 font-black text-sm">
                    {user.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm font-bold text-white truncate">
                  {user.name || "Sinefil"}
                </strong>
                <span className="text-xs text-neutral-400 truncate block">
                  {user.email || dict.nav.member}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </Link>
          </div>
        ) : (
          <div className="p-3.5 border-b border-white/10 flex gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
            >
              {dict.nav.login}
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-black text-center bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm shadow-amber-400/20"
            >
              {dict.nav.register}
            </Link>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3.5 space-y-5">
          {/* Main Navigation */}
          <nav className="space-y-0.5">
            <Link
              href="/"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/" && !searchParams.toString()
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Home className="w-4 h-4" />
              <span>{dict.nav.home}</span>
            </Link>

            <Link
              href="/search"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/search"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Compass className="w-4 h-4" />
              <span>{dict.nav.explore}</span>
            </Link>

            <Link
              href="/?type=movie"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                searchParams.get("type") === "movie"
                  ? "bg-amber-400/15 text-amber-400 font-black border border-amber-400/30"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Film className="w-4 h-4" />
              <span>{dict.nav.inTheatres}</span>
            </Link>

            <Link
              href="/?type=tv"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                searchParams.get("type") === "tv"
                  ? "bg-amber-400/15 text-amber-400 font-black border border-amber-400/30"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Tv className="w-4 h-4" />
              <span>{dict.nav.tvShows}</span>
            </Link>

            <Link
              href="/watchlist"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/watchlist"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <ListFilter className="w-4 h-4" />
              <span>{dict.nav.watchlist}</span>
            </Link>

            <Link
              href="/calendar"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/calendar" || pathname === "/upcoming-episodes"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>{dict.nav.calendar}</span>
            </Link>

            <Link
              href="/feed"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/feed"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Activity className="w-4 h-4" />
              <span>{dict.nav.feed}</span>
            </Link>

            <Link
              href="/community"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/community"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Users className="w-4 h-4" />
              <span>{dict.nav.community}</span>
            </Link>

            <Link
              href="/achievements"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                pathname === "/achievements"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/5"
              )}
            >
              <Award className="w-4 h-4" />
              <span>{dict.nav.achievements}</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:bg-amber-400/10 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{dict.nav.admin}</span>
              </Link>
            )}
          </nav>

          {/* Platforms Section */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="px-2 text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{dict.nav.platforms}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1">
              {PLATFORMS.map((p) => {
                const isActive = currentProvider === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/?provider=${p.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all",
                      isActive
                        ? "bg-white/10 text-white font-bold ring-1 ring-white/20"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", p.color)} />
                    <span className="truncate">{p.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Popular Genres Section */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="px-2 text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{dict.nav.popularGenres}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {GENRES.map((g) => {
                const isActive = currentGenre === g.id;
                return (
                  <Link
                    key={g.id}
                    href={`/?genre=${g.id}`}
                    onClick={onClose}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      isActive
                        ? "bg-amber-400 text-slate-950 font-black"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {locale === "en" ? g.nameEn : g.nameTr}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Plus Card */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400/10 via-amber-500/5 to-transparent border border-amber-400/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <strong className="text-xs sm:text-sm font-black text-white">CineLists Plus</strong>
            </div>
            <p className="text-xs text-neutral-400 leading-normal">
              {locale === "en"
                ? "Special profile themes, unlimited watchlists and advanced recommendations."
                : "Özel profil temaları, sınırsız listeler ve gelişmiş öneriler."}
            </p>
          </div>
        </div>

        {/* Footer / Settings & Language */}
        <div className="p-3 border-t border-white/10 shrink-0 flex items-center justify-between text-xs sm:text-sm font-semibold text-neutral-400 bg-slate-900/40">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>{dict.settings.title}</span>
          </Link>
          <LanguageSelector variant="dropdown" />
        </div>
      </div>
    </div>
  );
}
