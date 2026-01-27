"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Layers } from "lucide-react";
import EpisodeItem from "./episode-item";
import { cn } from "@/lib/utils";
import { useEffect, useState as useEState } from 'react';
import { fetchSeasonEpisodes } from "@/lib/client-actions";

type Season = {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
};

type SeasonListProps = {
    tmdbId: number;
    seasons: Season[];
    watchedEpisodes: { s: number; e: number }[];
};

export default function SeasonList({ tmdbId, seasons, watchedEpisodes }: SeasonListProps) {
    if (!seasons || seasons.length === 0) return null;
    const validSeasons = seasons.filter(s => s.episode_count > 0 && s.season_number > 0);
    const [isAllVisible, setIsAllVisible] = useState(false);
    const [expandedSeason, setExpandedSeason] = useState<number | null>(validSeasons[0]?.season_number || null);

    return (
        <div className="space-y-6">
            {/* Main Toggle Header */}
            <button
                onClick={() => setIsAllVisible(!isAllVisible)}
                className="w-full flex items-center justify-between group py-4 border-b border-white/5 hover:border-primary/30 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2 rounded-xl transition-all",
                        isAllVisible ? "bg-primary text-background" : "bg-white/5 text-neutral-400 group-hover:text-white"
                    )}>
                        <Layers className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-2xl font-black text-white tracking-tight">Sezonlar</h3>
                        <p className="text-sm font-bold text-neutral-500 mt-0.5">
                            Toplam {validSeasons.length} Sezon
                        </p>
                    </div>
                </div>
                <div className={cn(
                    "p-2 rounded-full border border-white/5 transition-all",
                    isAllVisible ? "bg-white/10 text-white rotate-180" : "bg-transparent text-neutral-500 group-hover:text-white"
                )}>
                    <ChevronDown className="w-6 h-6" />
                </div>
            </button>

            {/* Expandable Content Area */}
            {isAllVisible && (
                <div className="space-y-8 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Season Tabs Row */}
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        {validSeasons.map((season) => (
                            <button
                                key={season.id}
                                onClick={() => setExpandedSeason(season.season_number)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl font-bold text-sm transition-all border active:scale-95",
                                    expandedSeason === season.season_number
                                        ? "bg-primary text-background border-primary shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {season.name}
                            </button>
                        ))}
                    </div>

                    {/* Expanded Content View */}
                    {expandedSeason !== null && (
                        <div className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                            <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">
                                        {validSeasons.find(s => s.season_number === expandedSeason)?.name}
                                    </h3>
                                    <p className="text-sm font-semibold text-neutral-500 mt-0.5">
                                        {validSeasons.find(s => s.season_number === expandedSeason)?.episode_count} Bölüm Bulunuyor
                                    </p>
                                </div>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                <SeasonEpisodes
                                    tmdbId={tmdbId}
                                    seasonNumber={expandedSeason}
                                    watchedEpisodes={watchedEpisodes.filter(w => w.s === expandedSeason).map(w => w.e)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SeasonEpisodes({ tmdbId, seasonNumber, watchedEpisodes }: { tmdbId: number, seasonNumber: number, watchedEpisodes: number[] }) {
    const [episodes, setEpisodes] = useEState<any[]>([]);
    const [loading, setLoading] = useEState(true);

    useEffect(() => {
        setLoading(true);
        fetchSeasonEpisodes(tmdbId, seasonNumber).then(data => {
            setEpisodes(data.episodes || []);
            setLoading(false);
        });
    }, [tmdbId, seasonNumber]);

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Bölümler Yükleniyor...</p>
        </div>
    );

    return (
        <div className="divide-y divide-white/5">
            {episodes.map((episode: any) => (
                <EpisodeItem
                    key={episode.id}
                    tmdbId={tmdbId}
                    seasonNumber={seasonNumber}
                    episode={episode}
                    isWatched={watchedEpisodes.includes(episode.episode_number)}
                />
            ))}
        </div>
    );
}
