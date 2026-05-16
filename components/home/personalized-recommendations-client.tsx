"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Star } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { cn } from "@/lib/utils";
import { useSharedViewMode } from "./use-shared-view-mode";

type RecommendationItem = {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    poster_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    mediaType: "movie" | "tv";
    runtime?: number;
};

type PersonalizedRecommendationsClientProps = {
    results: RecommendationItem[];
    userRatingsMap: Record<number, number>;
    metadataMap: Record<number, { runtime?: number | null }>;
};

const formatRuntime = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return "";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
    }

    return `${mins}dk`;
};

export function PersonalizedRecommendationsClient({
    results,
    userRatingsMap,
    metadataMap,
}: PersonalizedRecommendationsClientProps) {
    const [expanded, setExpanded] = useState(false);
    const { viewMode } = useSharedViewMode();
    const initialVisibleCount = viewMode === "compact" ? 12 : 6;
    const visibleResults = useMemo(
        () => (expanded ? results : results.slice(0, initialVisibleCount)),
        [expanded, results, initialVisibleCount]
    );

    const isListMode = viewMode === "list";
    const isCompactMode = viewMode === "compact";
    const gridColumns = isCompactMode
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 justify-items-center"
        : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5";

    return (
        <div className="space-y-4">
            {isListMode ? (
                <div className="flex flex-col gap-3">
                    {visibleResults.map((item) => {
                        const releaseDate = item.release_date || item.first_air_date;
                        const runtime = item.runtime || metadataMap[item.id]?.runtime || undefined;
                        const year = releaseDate ? new Date(releaseDate).getFullYear() : "TBA";

                        return (
                            <Link
                                key={`${item.mediaType}-${item.id}`}
                                href={`/${item.mediaType}/${item.id}`}
                                className="group flex items-stretch gap-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all p-3 md:p-4"
                            >
                                <div className="relative shrink-0 w-20 sm:w-24 md:w-28 aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-slate-900">
                                    {item.poster_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                                            alt={item.title || item.name || "İçerik"}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 80px, 112px"
                                        />
                                    ) : null}
                                </div>

                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-2 py-0.5">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md",
                                                item.mediaType === "movie"
                                                    ? "bg-amber-400 text-black"
                                                    : "bg-blue-500 text-white"
                                            )}>
                                                {item.mediaType === "movie" ? "Film" : "Dizi"}
                                            </span>
                                            <span className="text-neutral-400">{year}</span>
                                            <div className="flex items-center gap-1 text-amber-400">
                                                <Star size={13} fill="currentColor" />
                                                <span>{item.vote_average?.toFixed(1) || "0.0"}</span>
                                            </div>
                                            {runtime ? (
                                                <div className="flex items-center gap-1 text-neutral-400">
                                                    <Clock size={13} />
                                                    <span>{formatRuntime(runtime)}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <h3 className="text-base md:text-lg font-black text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
                                            {item.title || item.name || "Tarih Bekleniyor"}
                                        </h3>

                                        {(item.original_title || item.original_name) && (item.original_title || item.original_name) !== (item.title || item.name) && (
                                            <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-wider line-clamp-1">
                                                {item.original_title || item.original_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs md:text-sm text-neutral-400 line-clamp-2 max-w-2xl">
                                            {item.runtime
                                                ? "Bu içerik için detaylı zaman bilgisi ve puanlar aşağıda."
                                                : "Detay sayfasında daha fazla bilgi bulabilirsiniz."}
                                        </p>

                                        <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-white/5 border border-white/10 px-2.5 py-1">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                            <span className="text-xs font-black text-white">
                                                {userRatingsMap[item.id] !== undefined ? userRatingsMap[item.id].toFixed(1) : (item.vote_average || 0).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className={gridColumns}>
                    {visibleResults.map((item) => (
                        <div key={`${item.mediaType}-${item.id}`} className="transition-all duration-300">
                            <MediaCard
                                id={item.id}
                                title={item.title || item.name || "Tarih Bekleniyor"}
                                originalTitle={item.original_title || item.original_name}
                                posterPath={item.poster_path ?? null}
                                voteAverage={item.vote_average || 0}
                                userRating={userRatingsMap[item.id]}
                                releaseDate={item.release_date || item.first_air_date}
                                runtime={item.runtime || metadataMap[item.id]?.runtime || undefined}
                                type={item.mediaType}
                                compact={isCompactMode}
                                fullWidth={!isCompactMode}
                            />
                        </div>
                    ))}
                </div>
            )}

            {results.length > initialVisibleCount && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                Daha Az Göster
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Daha Fazla Göster
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
