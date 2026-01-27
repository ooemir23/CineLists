"use client";

import { useState, useMemo } from "react";
import { Film, Tv, Calendar, Filter, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Credit = {
    id: number;
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    character?: string;
    poster_path?: string;
    release_date?: string;
    first_air_date?: string;
    genre_ids?: number[];
};

interface PersonCreditsProps {
    credits: Credit[];
}

export function PersonCredits({ credits }: PersonCreditsProps) {
    const [selectedType, setSelectedType] = useState<"all" | "movie" | "tv">("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);

    const now = new Date();

    // Remove duplicates based on media_type and id
    const uniqueCredits = useMemo(() => {
        const seen = new Set<string>();
        return credits.filter((credit) => {
            const key = `${credit.media_type}-${credit.id}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }, [credits]);

    // Separate upcoming and past credits
    const { upcomingCredits, pastCredits } = useMemo(() => {
        const upcoming: Credit[] = [];
        const past: Credit[] = [];

        uniqueCredits.forEach((credit) => {
            const dateStr = credit.release_date || credit.first_air_date;
            if (!dateStr) {
                upcoming.push(credit);
            } else {
                const creditDate = new Date(dateStr);
                if (creditDate > now) {
                    upcoming.push(credit);
                } else {
                    past.push(credit);
                }
            }
        });

        return { upcomingCredits: upcoming, pastCredits: past };
    }, [uniqueCredits]);

    // Get unique years from past credits
    const years = useMemo(() => {
        const yearSet = new Set<string>();
        pastCredits.forEach((credit) => {
            const dateStr = credit.release_date || credit.first_air_date;
            if (dateStr) {
                const year = new Date(dateStr).getFullYear().toString();
                yearSet.add(year);
            }
        });
        return Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
    }, [pastCredits]);

    // Filter function
    const filterCredits = (creditList: Credit[]) => {
        return creditList.filter((credit) => {
            if (selectedType !== "all" && credit.media_type !== selectedType) return false;
            if (selectedYear !== "all") {
                const dateStr = credit.release_date || credit.first_air_date;
                if (!dateStr) return false;
                const year = new Date(dateStr).getFullYear().toString();
                if (year !== selectedYear) return false;
            }
            return true;
        });
    };

    const filteredUpcoming = filterCredits(upcomingCredits);
    const filteredPast = filterCredits(pastCredits);

    const renderCreditCard = (credit: Credit) => (
        <Link
            key={`${credit.media_type}-${credit.id}`}
            href={`/${credit.media_type}/${credit.id}`}
            className="group space-y-3"
        >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-primary transition-all">
                {credit.poster_path ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
                        alt={credit.title || credit.name || ""}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center">🎬</div>
                )}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white border border-white/10">
                    {credit.media_type === "movie" ? "FİLM" : "DİZİ"}
                </div>
            </div>
            <div>
                <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                    {credit.title || credit.name}
                </p>
                <p className="text-xs text-neutral-500 line-clamp-1">{credit.character || "Oyuncu"}</p>
            </div>
        </Link>
    );

    return (
        <div className="space-y-8">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border",
                        showFilters
                            ? "bg-primary text-white border-primary"
                            : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                    )}
                >
                    <Filter className="w-4 h-4" />
                    Filtrele
                </button>

                {showFilters && (
                    <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Type Filter */}
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as any)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        >
                            <option value="all" className="bg-neutral-900">Tümü</option>
                            <option value="movie" className="bg-neutral-900">Filmler</option>
                            <option value="tv" className="bg-neutral-900">Diziler</option>
                        </select>

                        {/* Year Filter */}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        >
                            <option value="all" className="bg-neutral-900">Tüm Yıllar</option>
                            {years.map((year) => (
                                <option key={year} value={year} className="bg-neutral-900">{year}</option>
                            ))}
                        </select>

                        {/* Clear Filters */}
                        {(selectedType !== "all" || selectedYear !== "all") && (
                            <button
                                onClick={() => {
                                    setSelectedType("all");
                                    setSelectedYear("all");
                                }}
                                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Temizle
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Upcoming Credits */}
            {filteredUpcoming.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-green-500" />
                        Yakında Gelecek Yapımlar
                        <span className="text-sm font-normal text-neutral-500">({filteredUpcoming.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredUpcoming.map(renderCreditCard)}
                    </div>
                </section>
            )}

            {/* Past Credits */}
            {filteredPast.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Film className="w-6 h-6 text-primary" />
                        Öne Çıkan Yapımlar
                        <span className="text-sm font-normal text-neutral-500">({filteredPast.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredPast.map(renderCreditCard)}
                    </div>
                </section>
            )}

            {filteredUpcoming.length === 0 && filteredPast.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                    <p className="text-lg font-medium">Seçilen filtrelere uygun yapım bulunamadı.</p>
                </div>
            )}
        </div>
    );
}
