"use client";

import { useState, useTransition, useEffect } from "react";
import { ChevronDown, Loader2, Layers, CheckCircle2 } from "lucide-react";
import EpisodeItem from "./episode-item";
import { cn } from "@/lib/utils";
import { fetchSeasonEpisodes } from "@/lib/client-actions";
import { markSeasonAsWatched } from "@/lib/tv-actions";
import { useRouter } from "next/navigation";

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
    // All hooks must be called unconditionally at the top level
    const [isAllVisible, setIsAllVisible] = useState(false);
    const [showMoreSeasons, setShowMoreSeasons] = useState(false);
    const validSeasons = seasons?.filter(s => s.episode_count > 0 && s.season_number > 0) || [];
    const [expandedSeason, setExpandedSeason] = useState<number | null>(validSeasons[0]?.season_number || null);
    const [isPending, startTransition] = useTransition();
    const [watchedEpisodes, setWatchedEpisodes] = useState(initialWatchedEpisodes);
    const router = useRouter();

    useEffect(() => {
        setWatchedEpisodes(initialWatchedEpisodes);
    }, [initialWatchedEpisodes]);

    // Early return after all hooks are called
    if (!seasons || seasons.length === 0) return null;

    const handleMarkSeasonWatched = async (seasonNumber: number) => {
        // Get the season to find episode count
        const season = validSeasons.find(s => s.season_number === seasonNumber);
        if (!season) return;

        // Check if all episodes are already watched
        const seasonWatchedEpisodes = watchedEpisodes.filter(w => w.s === seasonNumber);
        const allWatched = seasonWatchedEpisodes.length === season.episode_count;

        // Optimistic update
        if (allWatched) {
            // Remove all watched episodes for this season
            setWatchedEpisodes(prev => prev.filter(w => w.s !== seasonNumber));
        } else {
            // Mark all episodes as watched
            const newWatchedEpisodes = Array.from({ length: season.episode_count }, (_, i) => ({
                s: seasonNumber,
                e: i + 1
            }));
            setWatchedEpisodes(prev => {
                // Remove existing watched episodes for this season
                const filtered = prev.filter(w => w.s !== seasonNumber);
                // Add all episodes
                return [...filtered, ...newWatchedEpisodes];
            });
        }

        // Call server action in background
        startTransition(async () => {
            try {
                const result = await markSeasonAsWatched(tmdbId, seasonNumber);
                if (result && 'error' in result) {
                    alert(result.error);
                    // Revert optimistic update on error
                    setWatchedEpisodes(initialWatchedEpisodes);
                } else {
                    // Refresh the page data without full reload
                    router.refresh();
                }
            } catch (err) {
                console.error("Client Error:", err);
                alert("Bir hata oluştu. Lütfen tekrar deneyin.");
                // Revert optimistic update on error
                setWatchedEpisodes(initialWatchedEpisodes);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Main Toggle Header */}
            <button
                onClick={() => setIsAllVisible(!isAllVisible)}
                className="w-full flex items-center justify-between group py-4 border-b border-white/5 hover:border-primary/30 transition-all font-sans"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2 rounded-xl transition-all",
                        isAllVisible ? "bg-primary text-background" : "bg-white/5 text-neutral-400 group-hover:text-white"
                    )}>
                        <Layers className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Sezonlar</h3>
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
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
                            {(showMoreSeasons ? validSeasons : validSeasons.slice(0, 4)).map((season) => (
                                <button
                                    key={season.id}
                                    onClick={() => setExpandedSeason(season.season_number)}
                                    className={cn(
                                        "px-2 md:px-5 py-2.5 rounded-xl font-black text-[10px] md:text-[11px] transition-all border active:scale-95 uppercase tracking-widest truncate",
                                        expandedSeason === season.season_number
                                            ? "bg-primary text-background border-primary shadow-lg shadow-primary/20"
                                            : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {season.name}
                                </button>
                            ))}
                        </div>

                        {validSeasons.length > 4 && !showMoreSeasons && (
                            <button
                                onClick={() => setShowMoreSeasons(true)}
                                className="w-full md:w-auto px-6 py-2 bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                            >
                                + {validSeasons.length - 4} SEZON DAHA
                            </button>
                        )}
                    </div>

                    {/* Expanded Content View */}
                    {expandedSeason !== null && (
                        <div className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                            <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase italic">
                                        {validSeasons.find(s => s.season_number === expandedSeason)?.name}
                                    </h3>
                                    <p className="text-sm font-bold text-neutral-500 mt-0.5">
                                        {validSeasons.find(s => s.season_number === expandedSeason)?.episode_count} Bölüm Bulunuyor
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleMarkSeasonWatched(expandedSeason);
                                    }}
                                    disabled={false}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-green-500 hover:text-white border border-white/10 hover:border-green-400 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group/btn active:scale-95"
                                >
                                    <CheckCircle2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    Sezonu Bitir (Tümünü İzle)
                                </button>
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
        <div className="py-10 md:py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] italic">Bölümler Hazırlanıyor...</p>
        </div>
    );

    const displayedEpisodes = showAll ? episodes : episodes.slice(0, 4);

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1 md:gap-0">
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

            {episodes.length > 4 && !showAll && (
                <div className="p-4 flex justify-center border-t border-white/5 bg-white/[0.01]">
                    <button
                        onClick={() => setShowAll(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        Devamını Göster ({episodes.length - 4} Bölüm Daha)
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
