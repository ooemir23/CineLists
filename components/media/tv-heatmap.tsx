"use client";

import { useState, useEffect } from "react";
import { fetchSeasonEpisodes } from "@/lib/client-actions";
import { getEpisodeStatsBulk } from "@/lib/rating-actions";
import { Loader2, Grid3X3, MessageCircle, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

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
    communityRating?: number;
    communityCount?: number;
    commentCount?: number;
};

type SeasonData = {
    season_number: number;
    episodes: EpisodeData[];
    average: number;
    communityAverage: number;
};

export function TvHeatmap({ tmdbId, seasons }: TvHeatmapProps) {
    const [heatmapData, setHeatmapData] = useState<SeasonData[]>([]);
    const [loading, setLoading] = useState(true);
    const params = useParams();

    const validSeasons = seasons.filter(s => s.episode_count > 0 && s.season_number > 0);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch community stats first
                const communityStats = await getEpisodeStatsBulk(tmdbId);

                // Fetch all seasons in parallel
                const results = await Promise.all(
                    validSeasons.map(async (season) => {
                        const data = await fetchSeasonEpisodes(tmdbId, season.season_number);
                        const episodes = data.episodes || [];
                        
                        const tmdbRatedEpisodes = episodes.filter((ep: any) => ep.vote_average > 0);
                        const tmdbAverage = tmdbRatedEpisodes.length > 0 
                            ? tmdbRatedEpisodes.reduce((acc: number, ep: any) => acc + ep.vote_average, 0) / tmdbRatedEpisodes.length 
                            : 0;

                        const seasonEpisodes = episodes.map((ep: any) => {
                            const stats = communityStats[`${season.season_number}-${ep.episode_number}`];
                            return {
                                episode_number: ep.episode_number,
                                vote_average: ep.vote_average,
                                communityRating: stats?.rating,
                                communityCount: stats?.count,
                                commentCount: stats?.comments
                            };
                        });

                        const communityRated = seasonEpisodes.filter((e: EpisodeData) => !!(e.communityCount && e.communityCount > 0));
                        const communityAverage = communityRated.length > 0
                            ? communityRated.reduce((acc: number, ep: EpisodeData) => acc + (ep.communityRating || 0), 0) / communityRated.length
                            : 0;

                        return {
                            season_number: season.season_number,
                            episodes: seasonEpisodes,
                            average: tmdbAverage,
                            communityAverage
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
    }, [tmdbId]);

    if (validSeasons.length === 0) return null;

    const maxEpisodes = Math.max(...validSeasons.map(s => s.episode_count), 0);

    const getColor = (rating: number) => {
        if (rating === 0) return "bg-neutral-800 text-neutral-500 opacity-20"; 
        if (rating >= 9.0) return "bg-[#1E7B44] text-white shadow-[0_0_15px_rgba(30,123,68,0.3)]"; 
        if (rating >= 8.0) return "bg-[#27A85C] text-white"; 
        if (rating >= 7.0) return "bg-[#F3C43D] text-black"; 
        if (rating >= 6.0) return "bg-[#F39C12] text-white"; 
        return "bg-[#E74C3C] text-white"; 
    };

    return (
        <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-3 md:p-6 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest animate-pulse">Harita Verileri Analiz Ediliyor...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar pb-4">
                        <div className="flex justify-center min-w-max">
                            <table className="border-separate border-spacing-[3px] md:border-spacing-[5px]">
                                <thead>
                                    <tr>
                                        <th className="p-1"></th>
                                        {heatmapData.map((season) => (
                                            <th key={season.season_number} className="p-1 pb-4 text-[10px] md:text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">
                                                S{season.season_number}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: maxEpisodes }, (_, i) => i + 1).map((epNum) => (
                                        <tr key={epNum}>
                                            <td className="p-1 pr-4 text-[10px] md:text-xs font-black text-neutral-600 text-right uppercase w-10 align-middle">
                                                E{epNum}
                                            </td>
                                            {heatmapData.map((season) => {
                                                const ep = season.episodes.find(e => e.episode_number === epNum);
                                                const rating = ep?.vote_average || 0;
                                                const hasCommunityData = (ep?.communityCount || 0) > 0 || (ep?.commentCount || 0) > 0;
                                                
                                                return (
                                                    <td key={season.season_number} className="p-0">
                                                        {ep ? (
                                                            <Link 
                                                                href={`/tv/${tmdbId}/s/${season.season_number}/e/${epNum}`}
                                                                className={cn(
                                                                    "relative w-10 h-8 md:w-[54px] md:h-9 flex flex-col items-center justify-center rounded-lg text-[9px] md:text-xs font-black transition-all hover:scale-110 hover:z-10 shadow-lg group/ep overflow-hidden",
                                                                    getColor(rating)
                                                                )}
                                                            >
                                                                {/* Community Indicator Dot */}
                                                                {hasCommunityData && (
                                                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
                                                                )}

                                                                <span className="relative z-10">{rating > 0 ? rating.toFixed(1) : '-'}</span>
                                                                
                                                                {/* Community Stats Hover Overlay */}
                                                                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover/ep:opacity-100 transition-opacity">
                                                                    {ep.communityCount && ep.communityCount > 0 ? (
                                                                        <div className="flex items-center gap-1 text-amber-400">
                                                                            <Star size={8} fill="currentColor" />
                                                                            <span className="text-[8px]">{ep.communityRating?.toFixed(1)}</span>
                                                                        </div>
                                                                    ) : null}
                                                                    {ep.commentCount && ep.commentCount > 0 ? (
                                                                        <div className="flex items-center gap-1 text-sky-400">
                                                                            <MessageCircle size={8} fill="currentColor" />
                                                                            <span className="text-[8px]">{ep.commentCount}</span>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </Link>
                                                        ) : (
                                                            <div className="w-12 h-10 md:w-[68px] md:h-12 flex items-center justify-center rounded-xl text-[10px] md:text-xs font-black bg-white/[0.01] text-white/5">
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
                                        <td className="p-1 pr-4 text-[9px] md:text-[10px] font-black text-neutral-600 text-right pt-8 uppercase tracking-wider align-bottom">
                                            AVG.
                                        </td>
                                        {heatmapData.map((season) => (
                                            <td key={season.season_number} className="pt-8 pb-0 px-1 text-center align-bottom">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] md:text-sm font-black text-white">
                                                            {season.average > 0 ? season.average.toFixed(1) : '-'}
                                                        </span>
                                                        {season.communityAverage > 0 && (
                                                            <span className="text-[8px] font-black text-amber-400 leading-none">
                                                                {season.communityAverage.toFixed(1)} <span className="opacity-50 font-bold">C</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-full h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)]"></div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                        <Users className="text-amber-400" size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Topluluk Odaklı</p>
                        <p className="text-[9px] text-neutral-500 font-medium">Sarı noktalar yorumları belirtir.</p>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="text-sky-400" size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Anlık Etkileşim</p>
                        <p className="text-[9px] text-neutral-500 font-medium">Bölüme tıklayıp sohbete katıl.</p>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center shrink-0">
                        <Star className="text-emerald-400" size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Puan Analizi</p>
                        <p className="text-[9px] text-neutral-500 font-medium">Renkler kaliteyi temsil eder.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
