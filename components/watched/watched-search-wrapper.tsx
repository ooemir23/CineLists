"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import WatchedSearchBar from "@/components/watched/watched-search-bar";
import { MediaCard } from "@/components/media/media-card";
import { Calendar, Star, User, Users, Film, Tv, Filter, RefreshCcw } from "lucide-react";

import { GENRE_MAP } from "@/lib/genres";

// Genre listeleri (sabit ID'ler üzerinden)
const MOVIE_GENRE_IDS = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
const TV_GENRE_IDS = [10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766, 10767, 10768, 37];

const MOVIE_GENRES = MOVIE_GENRE_IDS.map(id => GENRE_MAP[id]).sort();
const TV_GENRES = TV_GENRE_IDS.map(id => GENRE_MAP[id]).sort();
const ALL_GENRES = [...new Set([...MOVIE_GENRES, ...TV_GENRES])].sort();

export default function WatchedSearchBarWrapper({ watched }: { watched: any[] }) {
    const [searchValue, setSearchValue] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterOpen, setFilterOpen] = useState(false);

    // Filtreler
    const [filterType, setFilterType] = useState<string>("");
    const [filterRating, setFilterRating] = useState<string>("");
    const [filterRatingType, setFilterRatingType] = useState<"user" | "tmdb">("user");
    const [filterYear, setFilterYear] = useState<string>("");
    const [filterGenre, setFilterGenre] = useState<string>("");

    const filtered = useMemo(() => {
        let result = watched;
        if (searchValue) {
            result = result.filter(item =>
                (item.media.title || "").toLowerCase().includes(searchValue.toLowerCase())
            );
        }
        if (filterType) {
            result = result.filter(item => item.media.type === filterType);
        }
        if (filterRating) {
            if (filterRatingType === "user") {
                result = result.filter(item => {
                    if (item.rating === null || item.rating === undefined) return false;
                    return item.rating >= parseFloat(filterRating);
                });
            } else {
                result = result.filter(item => {
                    if (!item.media.voteAverage) return false;
                    return item.media.voteAverage >= parseFloat(filterRating);
                });
            }
        }
        if (filterYear) {
            result = result.filter(item => {
                if (!item.watchedAt) return false;
                return new Date(item.watchedAt).getFullYear().toString() === filterYear;
            });
        }
        if (filterGenre) {
            result = result.filter(item => {
                // media.genre veya media.genres (dizi/film)
                const genres = item.media.genres || item.media.genre || [];
                if (typeof genres === "string") return genres === filterGenre;
                if (Array.isArray(genres)) return genres.includes(filterGenre);
                return false;
            });
        }
        return result;
    }, [searchValue, watched, filterType, filterRating, filterRatingType, filterYear, filterGenre]);

    // Filtre menüsü
    const today = new Date();
    const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i);

    return (
        <>
            <WatchedSearchBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterClick={() => setFilterOpen(!filterOpen)}
            />
            {filterOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-3 bg-[#1b2334]/60 backdrop-blur-xl rounded-[1.5rem] p-3 md:p-4 mt-4 border border-white/5 shadow-2xl"
                >
                    {/* Tür filtresi - toggle button'lar */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setFilterType(filterType === "MOVIE" ? "" : "MOVIE")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all",
                                filterType === "MOVIE" ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Film size={14} />
                            Film
                        </button>
                        <button
                            onClick={() => setFilterType(filterType === "TV" ? "" : "TV")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all",
                                filterType === "TV" ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Tv size={14} />
                            Dizi
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-white/10 hidden md:block mx-1" />

                    {/* Puan türü ve değeri filtresi */}
                    <div className="flex flex-wrap gap-2 flex-1 items-center">
                        <div className="relative group">
                            <select
                                value={filterRatingType}
                                onChange={e => setFilterRatingType(e.target.value as "user" | "tmdb")}
                                className="bg-white/5 text-white rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none border border-white/5 focus:border-amber-400/30 transition-all appearance-none pr-10 cursor-pointer"
                            >
                                <option value="user" className="bg-[#1b2334]">Verdiğim Puanlar</option>
                                <option value="tmdb" className="bg-[#1b2334]">Genel Puan</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-hover:text-amber-400 transition-colors">
                                <Star size={12} fill="currentColor" />
                            </div>
                        </div>

                        <div className="relative group">
                            <select
                                value={filterRating}
                                onChange={e => setFilterRating(e.target.value)}
                                className={cn(
                                    "bg-white/5 rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none border border-white/5 focus:border-amber-400/30 transition-all appearance-none pr-10 cursor-pointer",
                                    filterRating ? "text-amber-400 border-amber-400/20" : "text-white"
                                )}
                            >
                                <option value="" className="bg-[#1b2334]">{filterRatingType === "user" ? "Tüm Puanlar" : "Tüm Genel"}</option>
                                <option value="9" className="bg-[#1b2334]">9+ Puan</option>
                                <option value="8" className="bg-[#1b2334]">8+ Puan</option>
                                <option value="7" className="bg-[#1b2334]">7+ Puan</option>
                                <option value="6" className="bg-[#1b2334]">6+ Puan</option>
                                <option value="5" className="bg-[#1b2334]">5+ Puan</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <select
                                value={filterGenre}
                                onChange={e => setFilterGenre(e.target.value)}
                                className={cn(
                                    "bg-white/5 rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none border border-white/5 focus:border-amber-400/30 transition-all appearance-none pr-10 cursor-pointer",
                                    filterGenre ? "text-amber-400 border-amber-400/20" : "text-white"
                                )}
                            >
                                <option value="" className="bg-[#1b2334]">Türler</option>
                                {(filterType === "TV" ? TV_GENRES : filterType === "MOVIE" ? MOVIE_GENRES : ALL_GENRES).map(g => <option key={g} value={g} className="bg-[#1b2334]">{g}</option>)}
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <select
                                value={filterYear}
                                onChange={e => setFilterYear(e.target.value)}
                                className={cn(
                                    "bg-white/5 rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none border border-white/5 focus:border-amber-400/30 transition-all appearance-none pr-10 cursor-pointer",
                                    filterYear ? "text-amber-400 border-amber-400/20" : "text-white"
                                )}
                            >
                                <option value="" className="bg-[#1b2334]">Tüm Yıllar</option>
                                {years.map(y => (
                                    <option key={y} value={y} className="bg-[#1b2334]">{y}</option>
                                ))}
                            </select>
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={() => { setFilterType(""); setFilterRating(""); setFilterRatingType("user"); setFilterYear(""); setFilterGenre(""); }}
                        className="px-5 py-2.5 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2"
                    >
                        <RefreshCcw size={14} />
                        Sıfırla
                    </button>
                </motion.div>
            )}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-8">
                    {filtered.length === 0 ? (
                        <div className="text-center text-neutral-500 mt-20 w-full">
                            <p className="text-xl font-bold">Sonuç bulunamadı.</p>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <MediaCard
                                key={item.id}
                                id={item.media.tmdbId}
                                title={item.media.title}
                                posterPath={item.media.posterPath}
                                voteAverage={item.media.voteAverage || 0}
                                userRating={item.rating}
                                runtime={item.media.runtime}
                                type={item.media.type === "MOVIE" ? "movie" : "tv"}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2 mt-8">
                    {filtered.length === 0 ? (
                        <div className="text-center text-neutral-500 mt-20 w-full">
                            <p className="text-xl font-bold">Sonuç bulunamadı.</p>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center bg-slate-900/80 rounded-xl px-4 py-3 gap-2 md:gap-6 shadow">
                                <div className="flex-1">
                                    <div className="font-bold text-white text-base md:text-lg">{item.media.title}</div>
                                    <div className="flex flex-wrap gap-4 text-xs md:text-sm text-neutral-300 mt-1">
                                        <span className="flex items-center gap-1"><Film className="w-4 h-4" />{item.media.type === "MOVIE" ? "Film" : "Dizi"}</span>
                                        {item.rating !== null && item.rating !== undefined && (
                                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" />{item.rating}</span>
                                        )}
                                        {item.watchedAt && (
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(item.watchedAt).toLocaleDateString()}</span>
                                        )}
                                        {item.recommendedByText && (
                                            <span className="flex items-center gap-1"><User className="w-4 h-4" />{item.recommendedByText}</span>
                                        )}
                                        {item.watchedWith && (
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(item.watchedWith);
                                                        return Array.isArray(parsed) ? parsed.join(", ") : parsed;
                                                    } catch (e) {
                                                        return item.watchedWith;
                                                    }
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Detay linki veya aksiyonlar eklenebilir */}
                            </div>
                        ))
                    )}
                </div>
            )}
        </>
    );
}
