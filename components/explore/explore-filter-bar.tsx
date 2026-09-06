"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Filter, X, Check, Film, Tv, TrendingUp, Star, Calendar, Sparkles } from "lucide-react";

const TYPE_OPTIONS = [
  { id: "movie", label: "Film", icon: Film },
  { id: "tv", label: "Dizi", icon: Tv },
];

const CATEGORY_OPTIONS = [
  { id: "trending", label: "Trend", icon: TrendingUp },
  { id: "popular", label: "Popüler", icon: Star },
  { id: "top_rated", label: "En İyiler", icon: Check },
  { id: "upcoming", label: "Yakında", icon: Calendar },
  { id: "discover", label: "Keşfet", icon: Filter },
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

export function ExploreFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const currentType = (params.type as string) || "movie";
  const currentCategory = (params.category as string) || "popular";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState(0);
  const [userPreferences, setUserPreferences] = useState<{ genres: string[], platforms: string[] } | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; logo: string }[]>([]);

  // Staging states
  const [stagedGenre, setStagedGenre] = useState(searchParams.get("genre") || "");
  const [stagedProvider, setStagedProvider] = useState(searchParams.get("provider") || "");
  const [stagedYear, setStagedYear] = useState(searchParams.get("year") || "");
  const [stagedRating, setStagedRating] = useState(searchParams.get("rating") || "");

  useEffect(() => {
    if (isMenuOpen) {
      setStagedGenre(searchParams.get("genre") || "");
      setStagedProvider(searchParams.get("provider") || "");
      setStagedYear(searchParams.get("year") || "");
      setStagedRating(searchParams.get("rating") || "");
    }
  }, [isMenuOpen, searchParams]);

  // Close overlays on navigation or global close event
  useEffect(() => {
    const handleClose = () => setIsMenuOpen(false);
    window.addEventListener("close-all-overlays", handleClose);
    return () => window.removeEventListener("close-all-overlays", handleClose);
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [genreRes, providerRes] = await Promise.all([
          fetch(`/api/tmdb/genres?type=${currentType}`),
          fetch(`/api/tmdb/providers?type=${currentType}&country=TR`)
        ]);
        const genreData = await genreRes.json();
        const providerData = await providerRes.json();
        setGenres(genreData.genres || []);
        setProviders(providerData.providers || []);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();

    const fetchPreferences = async () => {
      try {
        const res = await fetch("/api/user/preferences");
        const data = await res.json();
        setUserPreferences({
          genres: data.favoriteGenres || [],
          platforms: data.platforms || []
        });
      } catch (err) {
        console.error("Error fetching preferences:", err);
      }
    };
    fetchPreferences();
  }, [currentType]);

  const updatePath = (newType?: string, newCategory?: string) => {
    const type = newType || currentType;
    const category = newCategory || currentCategory;

    const params = new URLSearchParams(searchParams.toString());
    router.push(`/explore/${type}/${category}?${params.toString()}`);
  };

  const updateQuery = (key: string, value: string) => {
    if (key === "genre") setStagedGenre(value);
    else if (key === "provider") setStagedProvider(value);
    else if (key === "year") setStagedYear(value);
    else if (key === "rating") setStagedRating(value);
  };

  const commitFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (stagedGenre) params.set("genre", stagedGenre); else params.delete("genre");
    if (stagedProvider) params.set("provider", stagedProvider); else params.delete("provider");
    if (stagedYear) params.set("year", stagedYear); else params.delete("year");
    if (stagedRating) params.set("rating", stagedRating); else params.delete("rating");
    
    router.push(`/explore/${currentType}/${currentCategory}?${params.toString()}`, { scroll: false });
    setIsMenuOpen(false);
  };

  const clearAllStaged = () => {
    setStagedGenre("");
    setStagedProvider("");
    setStagedYear("");
    setStagedRating("");
  };

  return (
    <div className="space-y-6 mb-12">
      {/* Primary Navigation: Type & Category */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Type Switch */}
        <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => updatePath(opt.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-black transition-all uppercase tracking-tight",
                currentType === opt.id
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                  : "text-neutral-500 hover:text-white"
              )}
            >
              <opt.icon size={18} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category Selection */}
        <div className="flex-1 flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => updatePath(undefined, opt.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap",
                currentCategory === opt.id
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-neutral-500 hover:text-white"
              )}
            >
              <opt.icon size={14} className={currentCategory === opt.id ? "text-amber-400" : ""} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Advanced Filter Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all",
            isMenuOpen ? "bg-amber-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <Filter size={16} />
          Filtrele
        </button>
      </div>

      {/* Refined Pro Mobile Filter Overlay / Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          isMobile ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-slate-950/98 backdrop-blur-3xl flex flex-col"
            >
              {/* Compact Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                  Filtrele
                </h3>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Category Navigation - Horizontal Scroll */}
              <div className="flex bg-slate-900/30 border-b border-white/5 overflow-x-auto no-scrollbar py-3 px-4 gap-2">
                {[
                  { label: "Tür", value: stagedGenre },
                  { label: "Platform", value: stagedProvider },
                  { label: "Yıl", value: stagedYear },
                  { label: "Puan", value: stagedRating },
                ].map((cat, idx) => {
                  const isActive = activeFilterCategory === idx;
                  const hasSelection = !!cat.value;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveFilterCategory(idx)}
                      className={cn(
                        "flex-none px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                        isActive
                          ? "bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20"
                          : hasSelection
                            ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                            : "bg-white/5 border-white/5 text-neutral-500 hover:text-white"
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Options Content Area */}
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFilterCategory}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap gap-2 justify-center"
                  >
                    {(activeFilterCategory === 0 ? genres.map(g => ({ id: g.id.toString(), name: g.name })) :
                      activeFilterCategory === 1 ? providers.slice(0, 20) :
                      activeFilterCategory === 2 ? YEARS.map(y => ({ id: y, name: y })) :
                      [9, 8, 7, 6, 5].map(r => ({ id: r.toString(), name: `${r}+ Puan` }))
                    ).map((opt: any) => {
                      const queryKey = ["genre", "provider", "year", "rating"][activeFilterCategory];
                      const currentStaged = [stagedGenre, stagedProvider, stagedYear, stagedRating][activeFilterCategory];
                      const isSelected = currentStaged === opt.id;
                      
                      return (
                        <button
                          key={opt.id}
                          onClick={() => updateQuery(queryKey, opt.id)}
                          className={cn(
                            "px-5 py-3 rounded-2xl text-[11px] font-bold transition-all border",
                            isSelected
                              ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xl shadow-amber-400/20"
                              : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                          )}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Selection Summary Strip */}
              <div className="px-6 py-5 bg-amber-400/5 border-t border-white/10 flex items-center justify-between backdrop-blur-xl">
                <div className="flex flex-col flex-1 min-w-0 pr-4">
                  {stagedGenre || stagedProvider || stagedYear || stagedRating ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Seçili Filtreler</span>
                        <button 
                          onClick={clearAllStaged}
                          className="p-1 text-rose-500 active:scale-90 transition-transform"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 max-h-12 overflow-y-auto no-scrollbar">
                        {[
                          { id: stagedGenre, label: genres.find(g => g.id.toString() === stagedGenre)?.name, key: "genre" },
                          { id: stagedProvider, label: providers.find(p => p.id === stagedProvider)?.name, key: "provider" },
                          { id: stagedYear, label: stagedYear, key: "year" },
                          { id: stagedRating, label: stagedRating ? `${stagedRating}+ Puan` : null, key: "rating" }
                        ].filter(o => o.label).map((opt, i, arr) => (
                          <button 
                            key={i}
                            onClick={() => updateQuery(opt.key, "")}
                            className="flex items-center gap-1.5 text-[9px] font-black text-neutral-400 hover:text-white active:text-rose-500 transition-colors uppercase tracking-wider"
                          >
                            {opt.label}
                            {i < arr.length - 1 && <span className="text-neutral-700/50">•</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400">
                          <Sparkles size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Özel Öneriler</span>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                        {userPreferences ? (
                          [
                            ...userPreferences.genres.map(id => genres.find(g => g.id.toString() === id || g.name.toLowerCase() === id.toLowerCase())?.name || id),
                            ...userPreferences.platforms.map(id => providers.find(p => p.id === id || p.name.toLowerCase() === id.toLowerCase())?.name || id)
                          ].filter(val => val && !/^\d+$/.test(val)).join(" • ") || "Zevkine uygun içerikler"
                        ) : "Zevkine uygun içerikler"}
                      </span>
                    </>
                  )}
                </div>
                <button 
                  onClick={commitFilters}
                  className="flex-none px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-amber-400/10"
                >
                  Uygula
                </button>
              </div>

              {/* Sticky Footer */}
              <div className="p-6 border-t border-white/10 grid grid-cols-2 gap-4 bg-slate-950">
                <button
                  onClick={clearAllStaged}
                  className="py-4.5 rounded-2xl bg-white/5 border border-white/5 text-neutral-400 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                >
                  Sıfırla
                </button>
                <button
                  onClick={commitFilters}
                  className="py-4.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                >
                  Uygula
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl"
            >
              {/* Genre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2">Tür</label>
                <select
                  value={searchParams.get("genre") || ""}
                  onChange={(e) => updateQuery("genre", e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tümü</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2">Yıl</label>
                <select
                  value={searchParams.get("year") || ""}
                  onChange={(e) => updateQuery("year", e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tümü</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2">Puan</label>
                <select
                  value={searchParams.get("rating") || ""}
                  onChange={(e) => updateQuery("rating", e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tümü</option>
                  {[9, 8, 7, 6, 5].map(r => (
                    <option key={r} value={r}>{r}+ Puan</option>
                  ))}
                </select>
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2">Platform</label>
                <select
                  value={searchParams.get("provider") || ""}
                  onChange={(e) => updateQuery("provider", e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tümü</option>
                  {providers.slice(0, 20).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="col-span-2 md:col-span-4 flex justify-end pt-2">
                <button
                  onClick={() => router.push(`/explore/${currentType}/${currentCategory}`)}
                  className="text-xs font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                  <X size={14} /> Filtreleri Temizle
                </button>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
