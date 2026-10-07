"use client";

import { Calendar, Clock3, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { UpcomingEpisode } from "@/lib/calendar-types";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { calendarToday, calendarDaysLeft, matchesCalendarFilter, type CalendarFilter } from "@/lib/calendar-dates";

interface UpcomingEpisodesCarouselProps {
    episodes: UpcomingEpisode[];
    today?: string;
    query?: string;
}

export function UpcomingEpisodesCarousel({ episodes, today = calendarToday(), query = "" }: UpcomingEpisodesCarouselProps) {
    const { dict, locale } = useTranslation();
    const labels = dict.calendarUi;
    const [filter, setFilter] = useState<CalendarFilter>("awaiting");
    const [visibleCount, setVisibleCount] = useState(15);
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

    const validUpcoming = episodes.filter(ep => (calendarDaysLeft(ep.nextEpisodeDate, today) ?? -1) >= 0);
    const filteredEpisodes = validUpcoming.filter(ep => matchesCalendarFilter(ep.nextEpisodeDate, filter, today) &&
        [ep.showTitle, ep.nextEpisodeTitle ?? "", ...(ep.favoritePeople ?? [])].some(value => value.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale))));
    const filters: { id: CalendarFilter; label: string; hint?: string; count: number }[] = [
        { id: "awaiting", label: labels.awaiting, hint: labels.awaitingHint, count: validUpcoming.filter(ep => matchesCalendarFilter(ep.nextEpisodeDate, "awaiting", today)).length },
        { id: "today", label: labels.today, count: validUpcoming.filter(ep => matchesCalendarFilter(ep.nextEpisodeDate, "today", today)).length },
        { id: "week", label: labels.week, hint: labels.weekHint, count: validUpcoming.filter(ep => matchesCalendarFilter(ep.nextEpisodeDate, "week", today)).length },
    ];

    const formatFullDate = (episode: UpcomingEpisode) => {
        if (episode.nextEpisodeDate) {
            const date = new Date(`${episode.nextEpisodeDate}T12:00:00Z`);
            return date.toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", {
                timeZone: "UTC",
                day: "numeric",
                month: "long",
                weekday: "long",
            });
        }
        return labels.unknownDate;
    };

    const formatDaysLeft = (dateStr: string | null) => {
        if (!dateStr) return null;
        const days = calendarDaysLeft(dateStr, today);
        if (days === null) return null;
        if (days <= 0) return labels.today;
        if (days === 1) return labels.tomorrow;
        return labels.daysAway.replace("{days}", new Intl.NumberFormat(locale).format(days));
    };

    const formatEpisodeInfo = (episode: UpcomingEpisode) => {
        if (episode.mediaType === "movie") return episode.isTheatrical ? labels.movieInfo : labels.moviePremiere;
        if (episode.nextEpisodeSeason && episode.nextEpisodeNumber) {
            return labels.episodeInfo.replace("{season}", String(episode.nextEpisodeSeason)).replace("{episode}", String(episode.nextEpisodeNumber)) + (episode.nextEpisodeTitle ? ` · ${episode.nextEpisodeTitle}` : "");
        }
        if (episode.nextEpisodeSeason) return labels.seasonInfo.replace("{season}", String(episode.nextEpisodeSeason));
        return episode.releaseKind === "premiere" ? labels.seriesPremiere : labels.newEpisode;
    };

    return (
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <div className="flex flex-col gap-3 md:flex-shrink-0 md:justify-center">
                <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
                    <Link href="/calendar" className="group flex shrink-0 items-center gap-2 px-1">
                        <Calendar size={18} className="text-amber-400 group-hover:text-amber-300 transition-colors" />
                        <span className="text-base font-black text-white whitespace-nowrap group-hover:text-amber-200 transition-colors">{dict.nav.calendar}</span>
                    </Link>
                    <div className="grid min-w-0 flex-1 grid-cols-[1.5fr_0.8fr_1fr] gap-1 rounded-full border border-white/5 bg-white/5 p-1 shadow-inner md:flex md:flex-col md:rounded-none md:border-none md:bg-transparent md:p-0 md:shadow-none">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => { setFilter(f.id); setVisibleCount(15); }}
                            aria-pressed={filter === f.id}
                            title={f.hint}
                            className={cn(
                                "min-w-0 px-1 md:px-4 py-2 md:py-2 rounded-full md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-tight md:tracking-widest transition-all flex items-center justify-center md:justify-between gap-1 md:gap-3 md:w-full",
                                filter === f.id
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-transparent md:bg-white/5 text-neutral-500 hover:text-white border border-transparent md:border-white/5"
                            )}
                        >
                            <span>{f.label}</span>
                            {f.count > 0 && (
                                <span className={cn(
                                    "min-w-3 md:min-w-5 px-1 md:px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px] font-bold text-center",
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
                    aria-label={labels.previous}
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-1 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white opacity-100 shadow-xl backdrop-blur-md transition-opacity md:right-0 md:opacity-0 md:group-hover/carousel:opacity-100"
                    aria-label={labels.next}
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
                                {labels.empty}
                            </div>
                        ) : (
                            filteredEpisodes.slice(0, visibleCount).map((episode) => (
                                <Link
                                    key={`${episode.mediaType}-${episode.showId}-${episode.nextEpisodeDate}-${episode.nextEpisodeSeason}-${episode.nextEpisodeNumber}`}
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
                                            {episode.statusType === "plan_to_watch" ? dict.nav.watchlist : dict.nav.watching}
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
                                                        {isMounted ? (formatDaysLeft(episode.nextEpisodeDate) || labels.unknownDate) : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {episode.favoritePeople?.length ? (
                                            <p className="text-[10px] font-bold text-amber-300 line-clamp-2">
                                                {labels.favoritePeople.replace("{names}", episode.favoritePeople.join(", "))}
                                            </p>
                                        ) : null}
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
                        {filteredEpisodes.length > visibleCount && (
                            <button type="button" onClick={() => setVisibleCount(count => count + 15)} className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-blue-200">
                                {labels.more}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
