"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { UpcomingEpisode } from "@/lib/hero-personalization-actions";

interface UpcomingEpisodesCarouselProps {
    episodes: UpcomingEpisode[];
}

export function UpcomingEpisodesCarousel({ episodes }: UpcomingEpisodesCarouselProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Bilinmiyor";
        const date = new Date(dateStr);
        return date.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
                <Calendar size={18} className="text-blue-400" />
                <span className="text-sm font-bold text-white whitespace-nowrap">Yakında</span>
            </div>

            {/* Horizontal scroll */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-1">
                    {episodes.slice(0, 6).map((episode, idx) => (
                        <Link
                            key={idx}
                            href={`/tv/${episode.showId}`}
                            className="group flex-shrink-0 w-48 flex gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 transition-all"
                        >
                            {/* Mini poster */}
                            {episode.posterPath && (
                                <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w92${episode.posterPath}`}
                                        alt={episode.showTitle}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform"
                                    />
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                                        {episode.showTitle}
                                    </h4>
                                    <p className="text-[10px] text-neutral-400 mt-1">
                                        {formatDate(episode.nextEpisodeDate)}
                                    </p>
                                </div>

                                {/* Platform */}
                                {episode.platforms.length > 0 && (
                                    <div className="text-[8px] text-blue-300 font-bold truncate">
                                        {episode.platforms[0]}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
