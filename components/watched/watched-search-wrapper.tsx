"use client";
import React, { useState, useMemo } from "react";


import WatchedSearchBar from "@/components/watched/watched-search-bar";
import { MediaCard } from "@/components/media/media-card";
import { Calendar, Star, User, Users, Film } from "@/components/Icons";

// Genre listeleri (sabit)
const MOVIE_GENRES = [
    "Aksiyon", "Macera", "Animasyon", "Komedi", "Suç", "Belgesel", "Dram", "Aile", "Fantastik", "Tarih", "Korku", "Müzik", "Gizem", "Romantik", "Bilim Kurgu", "TV Film", "Gerilim", "Savaş", "Vahşi Batı"
];
const TV_GENRES = [
    "Aksiyon & Macera", "Animasyon", "Komedi", "Suç", "Belgesel", "Dram", "Aile", "Çocuk", "Gizem", "Haber", "Reality", "Bilim Kurgu & Fantastik", "Pembe Dizi", "Talk Show", "Savaş & Politika", "Vahşi Batı"
];
const ALL_GENRES = [...new Set([...MOVIE_GENRES, ...TV_GENRES])].sort();

export default function WatchedSearchBarWrapper({ watched }: { watched: any[] }) {
    const [searchValue, setSearchValue] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterOpen, setFilterOpen] = useState(true);

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
                <div className="flex flex-wrap gap-4 bg-slate-800 rounded-xl p-4 mt-4 mb-2">
                    {/* Tür filtresi - toggle button'lar */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType(filterType === "MOVIE" ? "" : "MOVIE")}
                            className={`px-3 py-2 text-xs rounded-lg transition ${filterType === "MOVIE" ? "bg-emerald-700/60 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                        >
                            Film
                        </button>
                        <button
                            onClick={() => setFilterType(filterType === "TV" ? "" : "TV")}
                            className={`px-3 py-2 text-xs rounded-lg transition ${filterType === "TV" ? "bg-emerald-700/60 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                        >
                            Dizi
                        </button>
                    </div>
                    {/* Puan türü filtresi */}
                    <select
                        value={filterRatingType}
                        onChange={e => setFilterRatingType(e.target.value as "user" | "tmdb")}
                        className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs"
                    >
                        <option value="user">Verdiğim Puanlar</option>
                        <option value="tmdb">Genel Puan</option>
                    </select>
                    {/* Puan filtresi */}
                    <select
                        value={filterRating}
                        onChange={e => setFilterRating(e.target.value)}
                        className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs"
                    >
                        <option value="">{filterRatingType === "user" ? "Tüm Verdiğim Puanlar" : "Tüm Genel Puanlar"}</option>
                        <option value="9">9+</option>
                        <option value="8">8+</option>
                        <option value="7">7+</option>
                        <option value="6">6+</option>
                        <option value="5">5+</option>
                    </select>
                    {/* Genre filtresi */}
                    <select
                        value={filterGenre}
                        onChange={e => setFilterGenre(e.target.value)}
                        className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs"
                    >
                        <option value="">Türler</option>
                        {(filterType === "TV" ? TV_GENRES : filterType === "MOVIE" ? MOVIE_GENRES : ALL_GENRES).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {/* İzlenme yılı filtresi */}
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs"
                    >
                        <option value="">Tüm Yıllar</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setFilterType(""); setFilterRating(""); setFilterRatingType("user"); setFilterYear(""); setFilterGenre(""); }}
                        className="text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-2"
                    >Temizle</button>
                </div>
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
