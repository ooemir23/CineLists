"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { ChevronDown, Loader2, Layers, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import EpisodeItem from "./episode-item";
import { cn } from "@/lib/utils";
import { fetchSeasonEpisodes } from "@/lib/client-actions";
import { markSeasonAsWatched } from "@/lib/tv-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

export default function SeasonList({ tmdbId, seasons, watchedEpisodes: initialWatchedEpisodes }: SeasonListProps) {
    const [isAllVisible, setIsAllVisible] = useState(true);
    const validSeasons = seasons?.filter(s => s.episode_count > 0 && s.season_number > 0) || [];
    const [expandedSeason, setExpandedSeason] = useState<number | null>(validSeasons[0]?.season_number || null);
    const [isPending, startTransition] = useTransition();
    const [watchedEpisodes, setWatchedEpisodes] = useState(initialWatchedEpisodes);
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setWatchedEpisodes(initialWatchedEpisodes);
    }, [initialWatchedEpisodes]);

    if (!seasons || seasons.length === 0) return null;

    const handleMarkSeasonWatched = async (seasonNumber: number) => {
        const season = validSeasons.find(s => s.season_number === seasonNumber);
        if (!season) return;

        const seasonWatchedEpisodes = watchedEpisodes.filter(w => w.s === seasonNumber);
        const allWatched = seasonWatchedEpisodes.length === season.episode_count;

        if (allWatched) {
            setWatchedEpisodes(prev => prev.filter(w => w.s !== seasonNumber));
        } else {
            const newWatchedEpisodes = Array.from({ length: season.episode_count }, (_, i) => ({
                s: seasonNumber,
                e: i + 1
            }));
            setWatchedEpisodes(prev => {
                const filtered = prev.filter(w => w.s !== seasonNumber);
                return [...filtered, ...newWatchedEpisodes];
            });
        }

        startTransition(async () => {
            try {
                const result = await markSeasonAsWatched(tmdbId, seasonNumber);
                if (result && 'error' in result) {
                    alert(result.error);
                    setWatchedEpisodes(initialWatchedEpisodes);
                } else {
                    router.refresh();
                }
            } catch (err) {
                console.error("Client Error:", err);
                setWatchedEpisodes(initialWatchedEpisodes);
            }
        });
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-4">
            {/* Main Header - Compact */}


            {/* Season Selector - Compact Posters */}
            <div className="relative group/nav">
                <div 
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto no-scrollbar pt-2 pb-3 -mx-1 px-1 snap-x"
                >
                    {validSeasons.map((season) => {
                        const isActive = expandedSeason === season.season_number;
                        const seasonWatchedCount = watchedEpisodes.filter(w => w.s === season.season_number).length;
                        const progress = (seasonWatchedCount / season.episode_count) * 100;
                        const isSeasonWatched = seasonWatchedCount === season.episode_count;

                        return (
                            <button
                                key={season.id}
                                onClick={() => setExpandedSeason(season.season_number)}
                                className={cn(
                                    "relative flex-shrink-0 w-[85px] sm:w-[110px] group transition-all snap-start",
                                    isActive ? "scale-105" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                {/* Season Poster */}
                                <div className={cn(
                                    "relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg transition-all border-2",
                                    isActive ? "border-amber-400" : "border-white/5"
                                )}>
                                    {season.poster_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w185${season.poster_path}`}
                                            alt={season.name}
                                            fill
                                            sizes="(max-width: 640px) 85px, 110px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                            <span className="text-xl font-black text-white/10">{season.season_number}</span>
                                        </div>
                                    )}
                                    
                                    {/* Watch Progress Overlay - Minimal */}
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/40">
                                        <div 
                                            className="h-full bg-amber-400 transition-all duration-500" 
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    
                                    {isSeasonWatched && (
                                        <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-lg">
                                            <CheckCircle2 size={10} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Season Label - Compact */}
                                <div className="mt-2 text-center">
                                    <p className={cn(
                                        "text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate",
                                        isActive ? "text-amber-400" : "text-white/50"
                                    )}>
                                        {season.name}
                                    </p>
                                    <p className="text-[8px] font-bold text-neutral-600 mt-0.5">
                                        {season.episode_count} Bölüm
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Expanded Content View - More Compact */}
            {expandedSeason !== null && (
                <div className="bg-white/[0.01] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 md:p-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">
                                {validSeasons.find(s => s.season_number === expandedSeason)?.name}
                            </h3>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                                <p className="text-[10px] font-bold text-neutral-500">
                                    {validSeasons.find(s => s.season_number === expandedSeason)?.episode_count} Bölüm
                                </p>
                                <div className="w-1 h-1 rounded-full bg-white/5" />
                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                    {watchedEpisodes.filter(w => w.s === expandedSeason).length} / {validSeasons.find(s => s.season_number === expandedSeason)?.episode_count} İzlendi
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleMarkSeasonWatched(expandedSeason);
                            }}
                            className={cn(
                                "w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                                watchedEpisodes.filter(w => w.s === expandedSeason).length === validSeasons.find(s => s.season_number === expandedSeason)?.episode_count
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                                    : "bg-white/5 text-white border border-white/10 hover:bg-emerald-500 hover:border-emerald-400"
                            )}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sezonu Tamamla
                        </button>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        <SeasonEpisodes
                            tmdbId={tmdbId}
                            seasonNumber={expandedSeason}
                            watchedEpisodes={watchedEpisodes.filter(w => w.s === expandedSeason).map(w => w.e)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function SeasonEpisodes({ tmdbId, seasonNumber, watchedEpisodes }: { tmdbId: number, seasonNumber: number, watchedEpisodes: number[] }) {
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        setLoading(true);
        fetchSeasonEpisodes(tmdbId, seasonNumber).then(data => {
            setEpisodes(data.episodes || []);
            setLoading(false);
        });
    }, [tmdbId, seasonNumber, refreshKey]);

    if (loading && episodes.length === 0) return (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400 opacity-50" />
            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.2em] italic">Yükleniyor...</p>
        </div>
    );

    const displayedEpisodes = showAll ? episodes : episodes.slice(0, 5);

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-1 gap-1">
                {displayedEpisodes.map((episode: any) => (
                    <EpisodeItem
                        key={episode.id}
                        tmdbId={tmdbId}
                        seasonNumber={seasonNumber}
                        episode={episode}
                        isWatched={watchedEpisodes.includes(episode.episode_number)}
                        onRefresh={refresh}
                    />
                ))}
            </div>

            {episodes.length > 5 && !showAll && (
                <div className="p-4 flex justify-center border-t border-white/5 bg-white/[0.01]">
                    <button
                        onClick={() => setShowAll(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                    >
                        Tüm Bölümler ({episodes.length})
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
