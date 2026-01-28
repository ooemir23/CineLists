"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, Filter, X, Check, Search, Film, Tv, TrendingUp, Star, Calendar } from "lucide-react";

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
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [rating, setRating] = useState(searchParams.get("rating") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const [provider, setProvider] = useState(searchParams.get("provider") || "");

  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; logo: string }[]>([]);

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
  }, [currentType]);

  const updatePath = (newType?: string, newCategory?: string) => {
    const type = newType || currentType;
    const category = newCategory || currentCategory;

    const params = new URLSearchParams(searchParams.toString());
    router.push(`/explore/${type}/${category}?${params.toString()}`);
  };

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/explore/${currentType}/${currentCategory}?${params.toString()}`, { scroll: false });
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

      {/* Advanced Filters Menu */}
      {isMenuOpen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 animate-fade-in-up backdrop-blur-2xl">
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
        </div>
      )}
    </div>
  );
}
