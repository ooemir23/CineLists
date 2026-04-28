"use client";

import { Calendar, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { UpcomingEpisode } from "@/lib/hero-personalization-actions";

interface UpcomingEpisodesWidgetProps {
    episodes: UpcomingEpisode[];
}

export function UpcomingEpisodesWidget({ episodes }: UpcomingEpisodesWidgetProps) {
    if (episodes.length === 0) {
        return null;
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Tarih Bilinmiyor";
        const date = new Date(dateStr);
        return date.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    };

    return (
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 rounded-2xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate">Yeni Bölümler</h3>
                    <p className="text-[10px] text-neutral-400 font-medium">İzlediklerinizden</p>
                </div>
            </div>

            {/* Episode List */}
            <div className="flex-1 space-y-2 min-w-0">
                {episodes.slice(0, 3).map((episode, idx) => (
                    <Link
                        key={idx}
                        href={`/tv/${episode.showId}`}
                        className="group flex gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {/* Mini Poster */}
                        {episode.posterPath && (
                            <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w92${episode.posterPath}`}
                                    alt={episode.showTitle}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform"
                                />
                            </div>
                        )}

                        {/* Show Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                                    {episode.showTitle}
                                </h4>
                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                    {formatDate(episode.nextEpisodeDate)}
                                </p>
                            </div>
                            
                            {/* Platforms */}
                            {episode.platforms.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-1">
                                    {episode.platforms.slice(0, 2).map((platform, pidx) => (
                                        <span
                                            key={pidx}
                                            className="text-[8px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded truncate"
                                        >
                                            {platform}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* View All */}
            <Link
                href="/profile"
                className="mt-3 pt-3 border-t border-white/10 text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center gap-1 justify-center"
            >
                <Play size={10} />
                Tümünü Gör
            </Link>
        </div>
    );
}
