"use client";

import { Calendar, Clock3, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { UpcomingEpisode } from "@/lib/hero-personalization-actions";

interface UpcomingEpisodesCarouselProps {
    episodes: UpcomingEpisode[];
}

export function UpcomingEpisodesCarousel({ episodes }: UpcomingEpisodesCarouselProps) {
    const [filter, setFilter] = useState<"all" | "today" | "week">("all");
    const [isMounted, setIsMounted] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.8 : 400;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const filteredEpisodes = episodes.filter(ep => {
        if (filter === "all") return true;
        
        // When filtered by today or week, only show "Watching" content as requested
        if (ep.statusType !== "watching") return false;

        if (!ep.nextEpisodeDate) return false;
        const date = new Date(ep.nextEpisodeDate);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24);
        
        if (filter === "today") return diffDays <= 0;
        if (filter === "week") return diffDays <= 7;
        return true;
    });

    const todayCount = episodes.filter(ep => {
        if (ep.statusType !== "watching") return false;
        if (!ep.nextEpisodeDate) return false;
        const date = new Date(ep.nextEpisodeDate);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 0;
    }).length;

    const weekCount = episodes.filter(ep => {
        if (ep.statusType !== "watching") return false;
        if (!ep.nextEpisodeDate) return false;
        const date = new Date(ep.nextEpisodeDate);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
    }).length;

    const formatFullDate = (episode: UpcomingEpisode) => {
        if (episode.nextEpisodeDate) {
            const date = new Date(episode.nextEpisodeDate);
            return date.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                weekday: "long",
            });
        }

        if (episode.mediaType === "tv") {
            if (episode.showStatus === "Ended" || episode.showStatus === "Canceled") {
                return "Final Yaptı";
            }
            return "Yeni Sezon Açıklanmadı";
        }

        return "Tarih Bekleniyor";
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
        if (episode.mediaType === "movie") return "Film";
        if (episode.nextEpisodeSeason && episode.nextEpisodeNumber) {
            return `${episode.nextEpisodeSeason}. Sezon ${episode.nextEpisodeNumber}. Bolum`;
        }
        if (episode.nextEpisodeSeason) {
            return `${episode.nextEpisodeSeason}. Sezon`;
        }
        return "BÖLÜM DURUMU";
    };

    return (
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <div className="flex flex-col gap-3 md:flex-shrink-0 md:justify-center">
                <div className="flex items-center gap-2">
                    <Link href="/upcoming-episodes" className="group flex shrink-0 items-center gap-2 px-1">
                        <Calendar size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                        <span className="text-base font-black text-white whitespace-nowrap group-hover:text-blue-200 transition-colors">Takvim</span>
                    </Link>
                    <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-full border border-white/5 bg-white/5 p-1 shadow-inner md:flex md:flex-col md:rounded-none md:border-none md:bg-transparent md:p-0 md:shadow-none">
                    {[
                        { id: "all", label: "Tümü", count: episodes.length },
                        { id: "today", label: "Bugün", count: todayCount },
                        { id: "week", label: "Hafta", count: weekCount },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={cn(
                                "min-w-0 px-2 md:px-4 py-2 md:py-2 rounded-full md:rounded-xl text-[7px] min-[390px]:text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center md:justify-between gap-1 md:gap-3 md:w-full",
                                filter === f.id
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-transparent md:bg-white/5 text-neutral-500 hover:text-white border border-transparent md:border-white/5"
                            )}
                        >
                            <span>{f.label}</span>
                            {f.count > 0 && (
                                <span className={cn(
                                    "min-w-5 px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px] font-bold text-center",
                                    filter === f.id ? "bg-white/20 text-white" : "bg-white/10 text-neutral-600"
                                )}>
                                    {f.count}
                                </span>
                            )}
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            {/* Horizontal scroll */}
            <div className="flex-1 w-full min-w-0 relative group/carousel">
                {/* Scroll Buttons */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-1 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white opacity-100 shadow-xl backdrop-blur-md transition-opacity md:left-0 md:opacity-0 md:group-hover/carousel:opacity-100"
                    aria-label="Takvimde geri git"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-1 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white opacity-100 shadow-xl backdrop-blur-md transition-opacity md:right-0 md:opacity-0 md:group-hover/carousel:opacity-100"
                    aria-label="Takvimde ileri git"
                >
                    <ChevronRight size={18} />
                </button>

                <div 
                    ref={scrollContainerRef}
                    className="flex-1 w-full min-w-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                >
                    <div className="flex gap-3 pb-1 px-1">
                        {filteredEpisodes.length === 0 ? (
                            <div className="flex items-center justify-center w-full py-4 px-8 rounded-2xl bg-white/5 border border-white/5 italic text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                Bu dönemde yayınlanacak bölüm bulunmuyor
                            </div>
                        ) : (
                            filteredEpisodes.slice(0, 15).map((episode, idx) => (
                                <Link
                                    key={idx}
                                    href={`/${episode.mediaType}/${episode.showId}`}
                                    className={cn(
                                        "group flex-shrink-0 w-[85vw] sm:w-72 flex gap-3 p-2.5 rounded-2xl transition-all border relative overflow-hidden snap-start",
                                        episode.statusType === "plan_to_watch"
                                            ? "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-500/5"
                                            : episode.statusType === "watching"
                                                ? "bg-sky-500/5 border-sky-500/30 hover:border-sky-500/60 shadow-lg shadow-sky-500/5"
                                                : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-blue-400/50"
                                    )}
                                >
                                    {/* Status Badge */}
                                    {isMounted && (episode.statusType === "plan_to_watch" || episode.statusType === "watching") && (
                                        <div className={cn(
                                            "absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[7px] font-black uppercase tracking-widest z-20",
                                            episode.statusType === "plan_to_watch" ? "bg-rose-500 text-white" : "bg-sky-500 text-white"
                                        )}>
                                            {episode.statusType === "plan_to_watch" 
                                                ? (() => {
                                                    const diffDays = episode.addedAt ? Math.floor((new Date().getTime() - new Date(episode.addedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                                    return diffDays > 0 ? `${diffDays} Gündür İzlemedin` : "Takip Listende";
                                                  })()
                                                : "İzliyorum"}
                                        </div>
                                    )}

                                    {/* Mini poster */}
                                    {episode.posterPath && (
                                        <div className={cn(
                                            "relative w-16 h-24 rounded-xl overflow-hidden flex-shrink-0",
                                            episode.statusType === "plan_to_watch" ? "border border-rose-500/20" : "border border-white/5"
                                        )}>
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
                                                {formatFullDate(episode)}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-xs text-neutral-200">
                                                    <Clock3 className="w-3 h-3 text-blue-300" />
                                                    <span className="font-bold text-blue-200">
                                                        {isMounted && episode.statusType === "plan_to_watch" && episode.addedAt
                                                            ? `${new Date(episode.addedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} tarihinde eklendi`
                                                            : (isMounted ? (formatDaysLeft(episode.nextEpisodeDate) || "Tarih yok") : "")}
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
