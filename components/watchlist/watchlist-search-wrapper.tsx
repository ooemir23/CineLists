"use client";
import React, { useState, useMemo } from "react";
import WatchedSearchBar from "@/components/watched/watched-search-bar";
import { MediaCard } from "@/components/media/media-card";
import { Calendar, Star, User, Users, Film } from "@/components/Icons";
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
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>("");
    const [filterYear, setFilterYear] = useState<string>("");
    const [filterGenre, setFilterGenre] = useState<string>("");
    const [filterDate, setFilterDate] = useState<string>("");

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
        if (filterDate) {
            result = result.filter(item => {
                if (!item.addedAt) return false;
                return item.addedAt.slice(0, 10) === filterDate;
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
    }, [searchValue, watchlist, filterType, filterYear, filterGenre, filterDate]) as any[];

    const today = new Date();
    const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i);
    const watchingItems = filtered.filter(item => item.status === "WATCHING");
    const planToWatchItems = filtered.filter(item => item.status === "PLAN_TO_WATCH");

    const renderGrid = (items: any[]) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-4">
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
                            <span className="flex items-center gap-1 text-amber-400 font-bold"><Film className="w-4 h-4" />{item.media.type === "MOVIE" ? "Film" : "Dizi"}</span>
                            {item.addedAt && (
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(item.addedAt).toLocaleDateString()}</span>
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
            <WatchedSearchBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterClick={() => setFilterOpen(!filterOpen)}
            />
            {filterOpen && (
                <div className="flex flex-wrap gap-4 bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 mt-4 mb-2 border border-white/5">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                    >
                        <option value="">Tüm Türler</option>
                        <option value="MOVIE">Film</option>
                        <option value="TV">Dizi</option>
                    </select>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                    >
                        <option value="">Tüm Yıllar</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                    />
                    <select
                        value={filterGenre}
                        onChange={e => setFilterGenre(e.target.value)}
                        className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                    >
                        <option value="">Tüm Kategoriler</option>
                        {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button
                        onClick={() => { setFilterType(""); setFilterYear(""); setFilterGenre(""); setFilterDate(""); }}
                        className="text-xs font-black uppercase tracking-widest text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl px-4 py-2.5 transition-all"
                    >Temizle</button>
                </div>
            )}

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
