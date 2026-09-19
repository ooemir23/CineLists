"use client";

import React, { useState, useMemo } from "react";
import { Search, LayoutGrid, Rows, Film, Tv, RotateCcw, X, Calendar } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { cn } from "@/lib/utils";

// Dinamik genre listesi (sadece eklenen içeriklerden)
function getGenres(list: any[], type: string) {
    const genresSet = new Set<string>();
    list.forEach(item => {
        if (type && item.media.type !== type) return;
        const genres = item.media.genres || item.media.genre || [];
        if (typeof genres === "string") genresSet.add(genres);
        else if (Array.isArray(genres)) genres.forEach((g: string) => genresSet.add(g));
    });
    return Array.from(genresSet).sort();
}

export default function WatchlistSearchBarWrapper({ watchlist }: { watchlist: any[] }) {
    const [searchValue, setSearchValue] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterType, setFilterType] = useState<string>("");
    const [filterYear, setFilterYear] = useState<string>("");
    const [filterGenre, setFilterGenre] = useState<string>("");

    // Dinamik genre listesi
    const genreOptions = useMemo(() => getGenres(watchlist, filterType), [watchlist, filterType]);

    const filtered = useMemo(() => {
        let result = watchlist;
        if (searchValue) {
            result = result.filter(item =>
                (item.media.title || "").toLowerCase().includes(searchValue.toLowerCase())
            );
        }
        if (filterType) {
            result = result.filter(item => item.media.type === filterType);
        }
        if (filterYear) {
            result = result.filter(item => {
                if (!item.addedAt) return false;
                return new Date(item.addedAt).getFullYear().toString() === filterYear;
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
    }, [searchValue, watchlist, filterType, filterYear, filterGenre]) as any[];

    const today = new Date();
    const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i);
    const watchingItems = filtered.filter(item => item.status === "WATCHING");
    const planToWatchItems = filtered.filter(item => item.status === "PLAN_TO_WATCH");

    const hasActiveFilters = Boolean(searchValue || filterType || filterYear || filterGenre);

    const clearFilters = () => {
        setSearchValue("");
        setFilterType("");
        setFilterYear("");
        setFilterGenre("");
    };

    const renderGrid = (items: any[]) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6 mt-4">
            {items.map((item: any) => (
                <MediaCard
                    key={item.id}
                    id={item.media.tmdbId}
                    title={item.media.title}
                    posterPath={item.media.posterPath}
                    voteAverage={0}
                    runtime={item.media.runtime || undefined}
                    type={item.media.type === "MOVIE" ? "movie" : "tv"}
                />
            ))}
        </div>
    );

    const renderList = (items: any[]) => (
        <div className="flex flex-col gap-2 mt-4">
            {items.map((item: any) => (
                <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center bg-slate-900/80 rounded-xl px-4 py-3 gap-2 md:gap-6 shadow border border-white/5">
                    <div className="flex-1">
                        <div className="font-bold text-white text-base md:text-lg">{item.media.title}</div>
                        <div className="flex flex-wrap gap-4 text-xs md:text-sm text-neutral-300 mt-1">
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Film className="w-4 h-4" />
                                {item.media.type === "MOVIE" ? "Film" : "Dizi"}
                            </span>
                            {item.addedAt && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(item.addedAt).toLocaleDateString()}
                                </span>
                            )}
                            <span className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                item.status === "WATCHING" ? "bg-sky-500/20 border-sky-500/30 text-sky-400" : "bg-amber-400/20 border-amber-400/30 text-amber-400"
                            )}>
                                {item.status === "WATCHING" ? "İzleniyor" : "İzlenecek"}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

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
                            placeholder="İzleneceklerde ara..."
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
                    {genreOptions.length > 0 && (
                        <select
                            value={filterGenre}
                            onChange={e => setFilterGenre(e.target.value)}
                            className={cn(
                                "bg-white/5 text-xs font-bold rounded-xl sm:rounded-2xl px-3 py-2 border border-white/5 outline-none focus:border-amber-400/40 cursor-pointer transition-all shrink-0 max-w-[150px] truncate",
                                filterGenre ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : "text-neutral-300"
                            )}
                        >
                            <option value="" className="bg-[#1b2334] text-white">Tüm Kategoriler</option>
                            {genreOptions.map(g => (
                                <option key={g} value={g} className="bg-[#1b2334] text-white">{g}</option>
                            ))}
                        </select>
                    )}

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

            {filtered.length === 0 ? (
                <div className="text-center text-neutral-500 mt-20 w-full">
                    <p className="text-xl font-bold uppercase tracking-widest opacity-50">Sonuç bulunamadı.</p>
                </div>
            ) : (
                <div className="space-y-12 mt-8">
                    {/* İzleniyor Bölümü */}
                    {watchingItems.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
                                <h2 className="text-xl font-black text-white tracking-tight uppercase">Şu An İzleniyor</h2>
                                <span className="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full text-[10px] font-black">{watchingItems.length}</span>
                            </div>
                            {viewMode === "grid" ? renderGrid(watchingItems) : renderList(watchingItems)}
                        </section>
                    )}

                    {/* İzlenecekler Bölümü */}
                    {planToWatchItems.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                                <h2 className="text-xl font-black text-white tracking-tight uppercase">İzlenecekler</h2>
                                <span className="bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black">{planToWatchItems.length}</span>
                            </div>
                            {viewMode === "grid" ? renderGrid(planToWatchItems) : renderList(planToWatchItems)}
                        </section>
                    )}
                </div>
            )}
        </>
    );
}
