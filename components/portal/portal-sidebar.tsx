"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
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
  ChevronDown,
  Layers,
  Flame,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/layout/language-selector";
import { useTranslation } from "@/lib/i18n/i18n-context";

type PortalSidebarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string | null;
  };
  isAdmin?: boolean;
};

const PLATFORMS = [
  { id: "8", name: "Netflix", color: "text-red-400" },
  { id: "119", name: "Prime Video", color: "text-sky-400" },
  { id: "337", name: "Disney+", color: "text-blue-400" },
  { id: "350", name: "Apple TV+", color: "text-neutral-300" },
  { id: "344", name: "BluTV", color: "text-amber-400" },
  { id: "613", name: "TOD", color: "text-teal-400" },
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

export function PortalSidebar({ user, isAdmin = false }: PortalSidebarProps) {
  const { dict, locale } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentProvider = searchParams.get("provider");
  const currentGenre = searchParams.get("genre");

  return (
    <aside className="hidden xl:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/10 bg-slate-950/80 backdrop-blur-xl z-40 select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0 drop-shadow-[0_4px_16px_rgba(251,191,36,0.35)] group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="CineLists"
              width={40}
              height={40}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center text-lg font-black tracking-tight text-white leading-none">
              <span className="text-amber-400">CINE</span>LISTS
            </div>
            <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mt-1">
              {locale === "en" ? "Cinema & TV Club" : "Sinema & Dizi Kulübü"}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
        {/* Main Section */}
        <nav className="space-y-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/" && !searchParams.toString()
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Home className="w-4 h-4" />
            {dict.nav.home}
          </Link>

          <Link
            href="/search"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/search"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Compass className="w-4 h-4" />
            {dict.nav.explore}
          </Link>

          <Link
            href="/?type=movie"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              searchParams.get("type") === "movie"
                ? "bg-amber-400/15 text-amber-400 font-black border border-amber-400/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Film className="w-4 h-4" />
            {dict.nav.inTheatres}
          </Link>

          <Link
            href="/?type=tv"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              searchParams.get("type") === "tv"
                ? "bg-amber-400/15 text-amber-400 font-black border border-amber-400/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Tv className="w-4 h-4" />
            {dict.nav.tvShows}
          </Link>

          <Link
            href="/watchlist"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/watchlist" ||
              pathname === "/watched" ||
              pathname === "/watching"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <ListFilter className="w-4 h-4" />
            {dict.nav.watchlist}
          </Link>

          <Link
            href="/calendar"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/calendar" || pathname === "/upcoming-episodes"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Calendar className="w-4 h-4" />
            {dict.nav.calendar}
          </Link>

          <Link
            href="/feed"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/feed"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Activity className="w-4 h-4" />
            {dict.nav.feed}
          </Link>

          <Link
            href="/community"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/community"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users className="w-4 h-4" />
            {dict.nav.community}
          </Link>

          <Link
            href="/achievements"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname === "/achievements"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Award className="w-4 h-4" />
            {dict.nav.achievements}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all border border-amber-400/20 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20",
                pathname.startsWith("/admin")
                  ? "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20"
                  : ""
              )}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Yönetim Merkezi</span>
            </Link>
          )}
        </nav>

        {/* Collapsible: Platformlar */}
        <details className="group/details" open>
          <summary className="flex items-center justify-between px-3 py-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white cursor-pointer list-none">
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              {dict.nav.platforms}
            </span>
            <ChevronDown className="w-3.5 h-3.5 group-open/details:rotate-180 transition-transform" />
          </summary>
          <div className="mt-1 space-y-0.5 pl-2">
            {PLATFORMS.map((p) => {
              const isActive = currentProvider === p.id;
              return (
                <Link
                  key={p.id}
                  href={`/?provider=${p.id}`}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    isActive
                      ? "bg-white/10 text-white font-bold"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>{p.name}</span>
                  <span className={cn("w-1.5 h-1.5 rounded-full", p.color)} />
                </Link>
              );
            })}
          </div>
        </details>

        {/* Collapsible: Kategoriler */}
        <details className="group/genres" open>
          <summary className="flex items-center justify-between px-3 py-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white cursor-pointer list-none">
            <span className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {dict.nav.popularGenres}
            </span>
            <ChevronDown className="w-3.5 h-3.5 group-open/genres:rotate-180 transition-transform" />
          </summary>
          <div className="mt-1 grid grid-cols-2 gap-1 pl-2">
            {GENRES.map((g) => {
              const isActive = currentGenre === g.id;
              return (
                <Link
                  key={g.id}
                  href={`/?genre=${g.id}`}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center transition-all truncate",
                    isActive
                      ? "bg-amber-400/20 text-amber-400 font-bold border border-amber-400/30"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {locale === "en" ? g.nameEn : g.nameTr}
                </Link>
              );
            })}
          </div>
        </details>

        {/* CineLists Plus Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400/10 via-amber-500/5 to-transparent border border-amber-400/20 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <strong className="text-xs font-black text-white uppercase tracking-tight">
              CineLists Plus
            </strong>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed font-medium">
            {locale === "en"
              ? "Personalized recommendations, special badges and unlimited watchlists."
              : "Kişiselleştirilmiş tavsiyeler, özel profil rozetleri ve sınırsız listeler."}
          </p>
          <Link
            href={user ? "/achievements" : "/login"}
            className="mt-3 block text-center py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-transform active:scale-95 shadow-sm shadow-amber-400/20"
          >
            {user
              ? (locale === "en" ? "Explore Badges" : "Rozetlerini Keşfet")
              : (locale === "en" ? "Join Now" : "Hemen Katıl")}
          </Link>
        </div>
      </div>

      {/* User & Language Footer */}
      <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-neutral-400 font-bold">
            {dict.settings.language}
          </span>
          <LanguageSelector variant="dropdown" />
        </div>

        {user ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden relative shrink-0 border border-white/10">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Kullanıcı"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-amber-400 text-xs">
                  {user.name?.slice(0, 1) || "U"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                {user.name || "Sinefil"}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user.email || dict.nav.member}
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-colors"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            {dict.nav.login}
          </Link>
        )}
      </div>
    </aside>
  );
}
