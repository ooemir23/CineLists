"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MediaCard } from "@/components/media/media-card";
import {
    Search,
    LayoutGrid,
    Rows,
    Calendar,
    Star,
    User,
    Users,
    Film,
    Tv,
    RotateCcw,
    X,
} from "lucide-react";

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

    // Filtreler
    const [filterType, setFilterType] = useState<string>("");
    const [filterRating, setFilterRating] = useState<string>("");
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
            result = result.filter(item => {
                const r = item.rating ?? item.media.voteAverage;
                if (r === null || r === undefined) return false;
                return r >= parseFloat(filterRating);
            });
        }
        if (filterYear) {
            result = result.filter(item => {
                if (!item.watchedAt) return false;
                return new Date(item.watchedAt).getFullYear().toString() === filterYear;
            });
        }
        if (filterGenre) {
            result = result.filter(item => {
                const genres = item.media.genres || item.media.genre || [];
                if (typeof genres === "string") return genres === filterGenre;
                if (Array.isArray(genres)) return genres.includes(filterGenre);
                return false;
            });
        }
        return result;
    }, [searchValue, watched, filterType, filterRating, filterYear, filterGenre]);

    const today = new Date();
    const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i);

    const hasActiveFilters = Boolean(searchValue || filterType || filterRating || filterYear || filterGenre);

    const clearFilters = () => {
        setSearchValue("");
        setFilterType("");
        setFilterRating("");
        setFilterYear("");
        setFilterGenre("");
    };

    return (
        <>
            {/* Tek Satır Kompakt Arama & Filtre Toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#1b2334]/70 backdrop-blur-xl rounded-2xl md:rounded-[2rem] px-3.5 sm:px-4 py-2.5 border border-white/10 shadow-xl">
                {/* Sol / Orta: Kısa Arama Kutusu + Yanında Filtreler */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                    {/* Kısa Arama Kutusu */}
                    <div className="flex items-center w-full sm:w-60 md:w-72 bg-white/5 rounded-xl sm:rounded-2xl px-3.5 py-2 border border-white/5 group focus-within:border-amber-400/40 transition-all shrink-0">
                        <Search size={16} className="text-neutral-500 group-focus-within:text-amber-400 transition-colors mr-2.5 shrink-0" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            placeholder="İzlenenlerde ara..."
                            className="bg-transparent outline-none text-white w-full text-xs sm:text-sm font-medium placeholder:text-neutral-500"
                        />
                        {searchValue && (
                            <button
                                onClick={() => setSearchValue("")}
                                className="text-neutral-400 hover:text-white p-0.5 rounded-full hover:bg-white/10"
                                aria-label="Aramayı temizle"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Tür Seçimi: Tümü / Film / Dizi */}
                    <div className="flex bg-white/5 p-1 rounded-xl sm:rounded-2xl border border-white/5 shrink-0 text-xs font-bold">
                        <button
                            onClick={() => setFilterType("")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-lg sm:rounded-xl transition-all",
                                !filterType ? "bg-amber-400 text-slate-950 font-black shadow-sm" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setFilterType(filterType === "MOVIE" ? "" : "MOVIE")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1",
                                filterType === "MOVIE" ? "bg-amber-400 text-slate-950 font-black shadow-sm" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Film size={13} />
                            <span>Film</span>
                        </button>
                        <button
                            onClick={() => setFilterType(filterType === "TV" ? "" : "TV")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1",
                                filterType === "TV" ? "bg-amber-400 text-slate-950 font-black shadow-sm" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Tv size={13} />
                            <span>Dizi</span>
                        </button>
                    </div>

                    {/* Puan Filtresi */}
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-xl sm:rounded-2xl px-3 py-2 border border-white/5 shrink-0 text-xs font-bold">
                        <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                        <select
                            value={filterRating}
                            onChange={e => setFilterRating(e.target.value)}
                            className="bg-transparent text-white outline-none cursor-pointer text-xs font-bold"
                        >
                            <option value="" className="bg-[#1b2334]">Tüm Puanlar</option>
                            <option value="9" className="bg-[#1b2334]">9+ Puan</option>
                            <option value="8" className="bg-[#1b2334]">8+ Puan</option>
                            <option value="7" className="bg-[#1b2334]">7+ Puan</option>
                            <option value="6" className="bg-[#1b2334]">6+ Puan</option>
                            <option value="5" className="bg-[#1b2334]">5+ Puan</option>
                        </select>
                    </div>

                    {/* Yıl Seçimi */}
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className={cn(
                            "bg-white/5 text-xs font-bold rounded-xl sm:rounded-2xl px-3 py-2 border border-white/5 outline-none focus:border-amber-400/40 cursor-pointer transition-all shrink-0",
                            filterYear ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : "text-neutral-300"
                        )}
                    >
                        <option value="" className="bg-[#1b2334] text-white">Tüm Yıllar</option>
                        {years.map(y => (
                            <option key={y} value={y} className="bg-[#1b2334] text-white">{y}</option>
                        ))}
                    </select>

                    {/* Kategori Seçimi */}
                    <select
                        value={filterGenre}
                        onChange={e => setFilterGenre(e.target.value)}
                        className={cn(
                            "bg-white/5 text-xs font-bold rounded-xl sm:rounded-2xl px-3 py-2 border border-white/5 outline-none focus:border-amber-400/40 cursor-pointer transition-all shrink-0 max-w-[150px] truncate",
                            filterGenre ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : "text-neutral-300"
                        )}
                    >
                        <option value="" className="bg-[#1b2334] text-white">Tüm Kategoriler</option>
                        {(filterType === "TV" ? TV_GENRES : filterType === "MOVIE" ? MOVIE_GENRES : ALL_GENRES).map(g => (
                            <option key={g} value={g} className="bg-[#1b2334] text-white">{g}</option>
                        ))}
                    </select>

                    {/* Temizle Butonu */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1.5 rounded-xl transition-all shrink-0"
                            title="Tüm filtreleri sıfırla"
                        >
                            <RotateCcw size={12} />
                            <span>Temizle</span>
                        </button>
                    )}
                </div>

                {/* Sağ Taraf: Sonuç Sayısı ve Grid/List Görünüm */}
                <div className="flex items-center gap-2 justify-end shrink-0">
                    <span className="text-xs text-neutral-400 font-medium hidden sm:inline mr-1">
                        {filtered.length} içerik
                    </span>
                    <div className="flex bg-white/5 p-1 rounded-xl sm:rounded-2xl border border-white/5">
                        <button
                            className={cn(
                                "p-2 rounded-lg sm:rounded-xl transition-all",
                                viewMode === "grid" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" : "text-neutral-400 hover:text-white"
                            )}
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid görünüm"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={cn(
                                "p-2 rounded-lg sm:rounded-xl transition-all",
                                viewMode === "list" ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" : "text-neutral-400 hover:text-white"
                            )}
                            onClick={() => setViewMode("list")}
                            aria-label="Liste görünüm"
                        >
                            <Rows size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6 mt-8">
                    {filtered.length === 0 ? (
                        <div className="text-center text-neutral-500 mt-20 w-full col-span-full">
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
                                                    } catch (_e) {
                                                        return item.watchedWith;
                                                    }
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </>
    );
}
