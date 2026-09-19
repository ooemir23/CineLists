"use client";

import { useState, useEffect, useRef } from "react";
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
  User,
  LogIn,
  Bell,
  Menu,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Bookmark,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalMobileDrawer } from "./portal-mobile-drawer";
import { LanguageSelector } from "@/components/layout/language-selector";
import { useTranslation } from "@/lib/i18n/i18n-context";

type PortalTopbarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string | null;
  };
  isAdmin?: boolean;
};

type SuggestionItem = {
  id: number | string;
  name: string;
  originalName?: string;
  type: "movie" | "tv" | "person" | "user";
  image: string | null;
  year?: string;
  vote_average?: number;
  department?: string;
};

export function PortalTopbar({ user, isAdmin = false }: PortalTopbarProps) {
  const { dict } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close suggestions when navigating or clicking outside
  useEffect(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Debounced search query fetcher
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search-suggest?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
            setIsOpen(true);
            setSelectedIndex(-1);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Arama önerisi hatası:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const navigateToFullSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectSuggestion = (s: SuggestionItem) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    if (s.type === "person") {
      router.push(`/person/${s.id}`);
    } else if (s.type === "movie" || s.type === "tv") {
      router.push(`/${s.type}/${s.id}`);
    } else if (s.type === "user") {
      router.push(`/profile/${s.id}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(s.name)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (suggestions.length > 0) {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
    }

    if (!isOpen) return;

    // Total selectable options: suggestions.length items + 1 for "Tüm sonuçları gör"
    const totalOptions = suggestions.length + 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (selectedIndex === suggestions.length) {
        e.preventDefault();
        navigateToFullSearch();
      }
    }
  };

  const getTypeBadge = (type: SuggestionItem["type"], department?: string) => {
    switch (type) {
      case "movie":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
            <Film className="w-2.5 h-2.5" /> {dict.media.typeMovie}
          </span>
        );
      case "tv":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-400/15 text-sky-400 border border-sky-400/30">
            <Tv className="w-2.5 h-2.5" /> {dict.media.typeTv}
          </span>
        );
      case "person":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
            <User className="w-2.5 h-2.5" /> {department || dict.nav.person}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-400/15 text-purple-400 border border-purple-400/30">
            <Users className="w-2.5 h-2.5" /> {dict.nav.member}
          </span>
        );
    }
  };

  const renderSuggestionsDropdown = (isMobileView = false) => {
    if (!isOpen) return null;

    return (
      <div
        className={cn(
          "z-50 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150",
          isMobileView
            ? "absolute top-full left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto"
            : "absolute top-full left-0 right-0 mt-2 max-h-[380px]"
        )}
      >
        {suggestions.length > 0 ? (
          <div className="p-1.5">
            <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between border-b border-white/5 mb-1">
              <span>{dict.nav.suggestedResults}</span>
              <span className="text-[10px] font-normal text-neutral-500 lowercase">
                {suggestions.length} {dict.nav.resultsCount}
              </span>
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-0.5 pr-0.5">
              {suggestions.map((item, index) => {
                const isSelected = selectedIndex === index;
                const hasDiffOriginal =
                  item.originalName &&
                  item.originalName.trim().toLowerCase() !== item.name.trim().toLowerCase();

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => {
                      handleSelectSuggestion(item);
                      setMobileSearchOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group",
                      isSelected
                        ? "bg-white/10 ring-1 ring-amber-400/40"
                        : "hover:bg-white/5"
                    )}
                  >
                    {/* Poster / Avatar Thumbnail */}
                    <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/10 flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="40px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-neutral-500">
                          {item.type === "movie" && <Film className="w-4 h-4" />}
                          {item.type === "tv" && <Tv className="w-4 h-4" />}
                          {item.type === "person" && <User className="w-4 h-4" />}
                          {item.type === "user" && <Users className="w-4 h-4" />}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs sm:text-sm font-bold truncate transition-colors flex items-baseline gap-1.5",
                          isSelected
                            ? "text-amber-400"
                            : "text-white group-hover:text-amber-400"
                        )}
                      >
                        <span className="truncate">{item.name}</span>
                        {hasDiffOriginal && (
                          <span className="text-[11px] font-normal text-neutral-400 italic truncate shrink-0">
                            ({item.originalName})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getTypeBadge(item.type, item.department)}
                        {item.year && (
                          <span className="text-[11px] text-neutral-400 font-medium">
                            {item.year}
                          </span>
                        )}
                        {typeof item.vote_average === "number" &&
                          item.vote_average > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {item.vote_average}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Arrow Hint */}
                    <ArrowRight
                      className={cn(
                        "w-4 h-4 text-neutral-500 transition-all shrink-0 mr-1",
                        isSelected
                          ? "text-amber-400 translate-x-0.5 opacity-100"
                          : "opacity-0 group-hover:opacity-100 group-hover:text-amber-400"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* View all results button */}
            <button
              type="button"
              onClick={() => {
                navigateToFullSearch();
                setMobileSearchOpen(false);
              }}
              onMouseEnter={() => setSelectedIndex(suggestions.length)}
              className={cn(
                "w-full mt-1.5 px-3 py-2 rounded-xl border-t border-white/5 flex items-center justify-between text-xs font-semibold transition-colors",
                selectedIndex === suggestions.length
                  ? "bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/40"
                  : "text-neutral-300 hover:text-amber-400 hover:bg-white/5"
              )}
            >
              <span className="truncate">
                &ldquo;<span className="text-white font-bold">{searchQuery}</span>&rdquo; {dict.nav.viewAllResults}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
                Enter ↵
              </span>
            </button>
          </div>
        ) : !isLoading && searchQuery.trim().length >= 2 ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-neutral-400 mb-2">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-neutral-200">
              &ldquo;{searchQuery}&rdquo; {dict.nav.noResultsFound}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              {dict.nav.searchHint}
            </p>
            <button
              type="button"
              onClick={() => {
                navigateToFullSearch();
                setMobileSearchOpen(false);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-bold transition-colors"
            >
              {dict.nav.goToAdvancedSearch}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Slide-over Drawer */}
      <PortalMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
      />

      <header className="sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/10 transition-shadow">
        {/* Top Header Row */}
        <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Mobile Search Active Bar (Takes over on mobile when search is clicked) */}
          {mobileSearchOpen ? (
            <div
              ref={searchContainerRef}
              className="flex-1 flex items-center gap-2 md:hidden animate-in fade-in duration-150 relative"
            >
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setIsOpen(false);
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
                aria-label="Aramayı kapat"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                  } else {
                    navigateToFullSearch();
                  }
                  setMobileSearchOpen(false);
                }}
                className="relative flex-1 flex items-center"
              >
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  id="portal-search-input-mobile"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                      setIsOpen(true);
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={dict.common.searchPlaceholder}
                  className="w-full h-10 pl-10 pr-16 rounded-xl bg-white/[0.08] focus:bg-slate-900 border border-amber-400/60 text-white placeholder-neutral-500 text-xs font-medium focus:outline-none transition-all"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {isLoading && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin mr-1" />
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                      aria-label="Temizle"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>

              {/* Mobile suggestions dropdown */}
              {renderSuggestionsDropdown(true)}
            </div>
          ) : (
            <>
              {/* Brand & Hamburger (Visible on mobile/tablet, brand logo only on mobile/tablet) */}
              <div className="flex items-center gap-2 xl:hidden">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Menüyü aç"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Link href="/" className="flex items-center gap-2 group">
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
              </div>

              {/* Desktop Search Bar (Hidden on small mobile, visible on md+) */}
              <div
                ref={searchContainerRef}
                className="hidden md:block flex-1 max-w-2xl relative"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                      handleSelectSuggestion(suggestions[selectedIndex]);
                    } else {
                      navigateToFullSearch();
                    }
                  }}
                  className="relative flex items-center w-full"
                >
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={inputRef}
                    id="portal-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                        setIsOpen(true);
                      }
                    }}
                    onKeyDown={handleInputKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={dict.home.searchMoviesAndShows}
                    className="w-full h-10 pl-10 pr-24 rounded-xl bg-white/[0.06] hover:bg-white/[0.08] focus:bg-slate-900 border border-white/10 focus:border-amber-400/60 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none transition-all shadow-inner"
                  />

                  <div className="absolute right-3 flex items-center gap-1.5">
                    {isLoading && (
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    )}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Aramayı temizle"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono text-neutral-400 pointer-events-none">
                      Ctrl K
                    </kbd>
                  </div>
                </form>

                {/* Desktop suggestions dropdown */}
                {renderSuggestionsDropdown(false)}
              </div>

              {/* İzlenenler / İzlenecekler / İzliyorum Hızlı Liste Sekmeleri (Arama barının sağında) */}
              <nav
                aria-label="Hızlı Liste Erişimi"
                className="hidden lg:flex items-center p-1 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-sm shrink-0 gap-1 transition-colors"
              >
                <Link
                  href="/watched"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    pathname === "/watched"
                      ? "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{dict.nav.watched}</span>
                </Link>

                <Link
                  href="/watchlist"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    pathname === "/watchlist"
                      ? "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{dict.nav.watchlist}</span>
                </Link>

                <Link
                  href="/watching"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    pathname === "/watching"
                      ? "bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{dict.nav.watching}</span>
                </Link>
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Language Selector */}
                <LanguageSelector variant="dropdown" />

                {/* Mobile Search Button trigger (Visible only on < md) */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(true);
                    setTimeout(() => mobileInputRef.current?.focus(), 60);
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/5 border border-white/5 md:hidden transition-colors"
                  aria-label="Arama yap"
                >
                  <Search className="w-4 h-4" />
                </button>

                {user ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href="/notifications"
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors relative"
                      title="Bildirimler"
                    >
                      <Bell className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 p-1 pl-1.5 sm:pl-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
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
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href="/login"
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {dict.nav.login}
                    </Link>
                    <Link
                      href="/register"
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-slate-950 transition-transform active:scale-95 shadow-md shadow-amber-400/20"
                    >
                      {dict.nav.register}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Section Tabs Bar (Merlin'in Kazanı style horizontal bar with subtle fade gradient on mobile) */}
        <div className="relative px-3 sm:px-6 py-1.5 border-t border-white/5 bg-slate-950/40 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-l after:from-slate-950 after:to-transparent after:pointer-events-none md:after:hidden">
          <div className="flex items-center gap-1.5 max-w-[1600px] mx-auto overflow-x-auto scrollbar-hide">
            {[
              { label: dict.nav.home, href: "/" },
              { label: dict.nav.explore, href: "/search" },
              { label: dict.nav.inTheatres, href: "/?type=movie" },
              { label: dict.nav.tvShows, href: "/?type=tv" },
              { label: dict.nav.topRated, href: "/?category=top_rated" },
              { label: dict.nav.community, href: "/community" },
            ].map((tab) => {
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
                    "px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all shrink-0",
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
      </header>
    </>
  );
}
