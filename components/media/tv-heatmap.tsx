"use client";

import { useState, useEffect } from "react";
import { fetchSeasonEpisodes } from "@/lib/client-actions";
import { Loader2, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Season = {
    season_number: number;
    episode_count: number;
    name: string;
};

type TvHeatmapProps = {
    tmdbId: number;
    seasons: Season[];
};

type EpisodeData = {
    episode_number: number;
    vote_average: number;
};

type SeasonData = {
    season_number: number;
    episodes: EpisodeData[];
    average: number;
};

export function TvHeatmap({ tmdbId, seasons }: TvHeatmapProps) {
    const [heatmapData, setHeatmapData] = useState<SeasonData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const validSeasons = seasons.filter(s => s.episode_count > 0 && s.season_number > 0);

    useEffect(() => {
        if (!isOpen) return;
        
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch all seasons in parallel
                const results = await Promise.all(
                    validSeasons.map(async (season) => {
                        const data = await fetchSeasonEpisodes(tmdbId, season.season_number);
                        const episodes = data.episodes || [];
                        const validEpisodes = episodes.filter((ep: any) => ep.vote_average > 0);
                        
                        const totalScore = validEpisodes.reduce((acc: number, ep: any) => acc + ep.vote_average, 0);
                        const average = validEpisodes.length > 0 ? totalScore / validEpisodes.length : 0;

                        return {
                            season_number: season.season_number,
                            episodes: episodes.map((ep: any) => ({
                                episode_number: ep.episode_number,
                                vote_average: ep.vote_average,
                            })),
                            average
                        };
                    })
                );

                if (isMounted) {
                    setHeatmapData(results);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Heatmap loading error:", error);
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [tmdbId, isOpen]);

    if (validSeasons.length === 0) return null;

    const maxEpisodes = Math.max(...validSeasons.map(s => s.episode_count), 0);

    const getColor = (rating: number) => {
        if (rating === 0) return "bg-neutral-800 text-neutral-500"; // Unrated or unreleased
        if (rating >= 9.0) return "bg-[#1E7B44] text-white"; // Deep green
        if (rating >= 8.0) return "bg-[#27A85C] text-white"; // Normal green
        if (rating >= 7.0) return "bg-[#F3C43D] text-black"; // Yellow
        if (rating >= 6.0) return "bg-[#F39C12] text-white"; // Orange
        return "bg-[#E74C3C] text-white"; // Red
    };

    return (
        <div className="mt-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-center gap-3 py-4 border border-white/5 bg-white/[0.02] hover:bg-white/5 rounded-2xl transition-all font-sans group"
            >
                <Grid3X3 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-black tracking-widest uppercase italic text-white">Bölüm Isı Haritası (Rating Heatmap)</span>
            </button>

            {isOpen && (
                <div className="mt-4 p-4 md:p-8 bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-x-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Harita Oluşturuluyor...</p>
                        </div>
                    ) : (
                        <div className="flex justify-center min-w-max pb-4">
                            <table className="border-separate border-spacing-[4px] md:border-spacing-[6px]">
                                <thead>
                                    <tr>
                                        <th className="p-1"></th>
                                        {heatmapData.map((season) => (
                                            <th key={season.season_number} className="p-1 pb-3 text-[10px] md:text-xs font-black text-neutral-400 uppercase tracking-wider">
                                                S{season.season_number}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: maxEpisodes }, (_, i) => i + 1).map((epNum) => (
                                        <tr key={epNum}>
                                            <td className="p-1 pr-3 text-[10px] md:text-xs font-black text-neutral-500 text-right uppercase w-8 align-middle">
                                                E{epNum}
                                            </td>
                                            {heatmapData.map((season) => {
                                                const ep = season.episodes.find(e => e.episode_number === epNum);
                                                const rating = ep?.vote_average || 0;
                                                return (
                                                    <td key={season.season_number} className="p-0">
                                                        {ep && rating > 0 ? (
                                                            <div className={cn(
                                                                "w-10 h-8 md:w-[52px] md:h-9 flex items-center justify-center rounded text-[10px] md:text-xs font-bold transition-all hover:scale-110 hover:shadow-lg cursor-default shadow-sm",
                                                                getColor(rating)
                                                            )} title={`S${season.season_number} E${epNum} - Puan: ${rating.toFixed(1)}`}>
                                                                {rating.toFixed(1)}
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-8 md:w-[52px] md:h-9 flex items-center justify-center rounded text-[10px] md:text-xs font-bold bg-[#2A2A2A] text-neutral-600 shadow-sm">
                                                                -
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="p-1 pr-3 text-[9px] md:text-[10px] font-black text-neutral-500 text-right pt-6 uppercase tracking-wider align-bottom">
                                            AVG.
                                        </td>
                                        {heatmapData.map((season) => (
                                            <td key={season.season_number} className="pt-6 pb-0 px-1 text-center align-bottom">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="text-[11px] md:text-sm font-black text-white">
                                                        {season.average > 0 ? season.average.toFixed(1) : '-'}
                                                    </span>
                                                    <div className="w-full h-0.5 bg-[#27A85C] rounded-full"></div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
