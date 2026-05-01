"use client";

import { Calendar, Clock3 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { UpcomingEpisode } from "@/lib/hero-personalization-actions";

interface UpcomingEpisodesCarouselProps {
    episodes: UpcomingEpisode[];
}

export function UpcomingEpisodesCarousel({ episodes }: UpcomingEpisodesCarouselProps) {
    const formatFullDate = (dateStr: string | null) => {
        if (!dateStr) return "Bilinmiyor";
        const date = new Date(dateStr);
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            weekday: "long",
        });
    };

    const formatDaysLeft = (dateStr: string | null) => {
        if (!dateStr) return null;
        const today = new Date();
        const target = new Date(dateStr);
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const diffMs = startOfTarget.getTime() - startOfToday.getTime();
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (days < 0) return "Bugun";
        if (days === 0) return "Bugun";
        if (days === 1) return "1 gun sonra";
        return `${days} gun sonra`;
    };

    const formatEpisodeInfo = (episode: UpcomingEpisode) => {
        if (episode.nextEpisodeSeason && episode.nextEpisodeNumber) {
            return `${episode.nextEpisodeSeason}. Sezon ${episode.nextEpisodeNumber}. Bolum`;
        }
        if (episode.nextEpisodeSeason) {
            return `${episode.nextEpisodeSeason}. Sezon`;
        }
        return "Sonraki bolum";
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Bilinmiyor";
        const date = new Date(dateStr);
        return date.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full min-w-0">
            <Link href="/upcoming-episodes" className="flex items-center gap-2 flex-shrink-0 group px-1">
                <Calendar size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                <span className="text-sm font-bold text-white whitespace-nowrap group-hover:text-blue-200 transition-colors">Takvim</span>
            </Link>

            {/* Horizontal scroll */}
            <div className="flex-1 w-full min-w-0 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-1 px-1">
                    {episodes.slice(0, 6).map((episode, idx) => (
                        <Link
                            key={idx}
                            href={`/tv/${episode.showId}`}
                            className="group flex-shrink-0 w-[85vw] sm:w-72 flex gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 transition-all"
                        >
                            {/* Mini poster */}
                            {episode.posterPath && (
                                <div className="relative w-16 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w185${episode.posterPath}`}
                                        alt={episode.showTitle}
                                        fill
                                        className="object-fill group-hover:scale-110 transition-transform"
                                    />
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                                        {episode.showTitle}
                                    </h4>
                                    <p className="text-xs text-blue-200/90 mt-0.5 line-clamp-1 font-bold">
                                        {formatEpisodeInfo(episode)}
                                    </p>
                                    <p className="text-sm text-white font-black tracking-tight mt-1 line-clamp-1">
                                        {formatFullDate(episode.nextEpisodeDate)}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs text-neutral-200">
                                            <Clock3 className="w-3 h-3 text-blue-300" />
                                            <span className="font-bold text-blue-200">
                                                {formatDaysLeft(episode.nextEpisodeDate) || "Tarih yok"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Platform */}
                                {episode.platforms.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {episode.platformLogos && episode.platformLogos.length > 0 && (
                                            <div className="flex items-center -space-x-1">
                                                {episode.platformLogos.map((platform) => (
                                                    <div
                                                        key={platform.name}
                                                        className="relative w-4 h-4 rounded-full overflow-hidden border border-white/10 bg-white/5"
                                                        title={platform.name}
                                                    >
                                                        {platform.logoPath ? (
                                                            <Image
                                                                src={`https://image.tmdb.org/t/p/w92${platform.logoPath}`}
                                                                alt={platform.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="text-[9px] text-blue-300 font-bold truncate">
                                            {episode.platforms.join(" · ")}
                                        </div>
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
