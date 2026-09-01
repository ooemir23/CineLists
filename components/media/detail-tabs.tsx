"use client";

import React, { useEffect, useState } from "react";
import { Grid3X3, LayoutGrid, MessageSquare, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CastList, type CastMember } from "./cast-list";
import SeasonList, { type Season } from "./season-list";
import { CommentsSection, type Comment } from "./comments";
import { MediaCard } from "./media-card";
import { TvHeatmap } from "./tv-heatmap";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Tab = "cast" | "seasons" | "comments" | "similar" | "heatmap";

type WatchProgress = {
    s: number;
    e: number;
};

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
};

interface DetailTabsProps {
    type: "movie" | "tv";
    tmdbId: number;
    title: string;
    posterPath?: string | null;
    cast: CastMember[];
    seasons?: Season[];
    initialRecommendations?: RecommendationItem[];
    watchedEpisodes: WatchProgress[];
    initialComments: Comment[];
    currentUserId?: string;
    director?: string;
    producer?: string;
}

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "cast", label: "Oyuncular", icon: Users },
    { id: "seasons", label: "Sezonlar", icon: LayoutGrid },
    { id: "heatmap", label: "Puan Haritası", icon: Grid3X3 },
    { id: "comments", label: "Yorumlar", icon: MessageSquare },
    { id: "similar", label: "Benzer", icon: Star },
];

export function DetailTabs({
    type,
    tmdbId,
    title,
    posterPath,
    cast,
    seasons,
    initialRecommendations = [],
    watchedEpisodes,
    initialComments,
    currentUserId,
    director,
    producer,
}: DetailTabsProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const queryTab = searchParams.get("tab") as Tab | null;
    const initialTab = queryTab && TABS.some((tab) => tab.id === queryTab)
        ? queryTab
        : type === "tv" && seasons && seasons.length > 0
            ? "seasons"
            : "cast";

    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>(initialRecommendations);
    const [recommendationsLoaded, setRecommendationsLoaded] = useState(initialRecommendations.length > 0);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    useEffect(() => {
        setRecommendations(initialRecommendations);
        setRecommendationsLoaded(initialRecommendations.length > 0);
    }, [tmdbId, initialRecommendations]);

    useEffect(() => {
        if (queryTab && TABS.some((tab) => tab.id === queryTab)) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);

    useEffect(() => {
        if (activeTab !== "similar" || recommendationsLoaded || recommendationsLoading) {
            return;
        }

        const controller = new AbortController();

        const loadRecommendations = async () => {
            setRecommendationsLoading(true);

            try {
                const res = await fetch(`/api/tmdb/recommendations?type=${type}&id=${tmdbId}`, {
                    signal: controller.signal,
                    cache: "force-cache",
                });

                if (!res.ok) {
                    return;
                }

                const data: { results?: RecommendationItem[] } = await res.json();
                setRecommendations(Array.isArray(data?.results) ? data.results : []);
            } catch {
                // Silent fallback is intentional.
            } finally {
                setRecommendationsLoaded(true);
                setRecommendationsLoading(false);
            }
        };

        loadRecommendations();

        return () => controller.abort();
    }, [activeTab, recommendationsLoaded, recommendationsLoading, tmdbId, type]);

    const handleTabChange = (tabId: Tab) => {
        setActiveTab(tabId);

        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const activeTabs = TABS.filter((tab) => {
        if (tab.id === "seasons") return type === "tv" && !!seasons?.length;
        if (tab.id === "heatmap") return type === "tv" && !!seasons?.length;
        return true;
    });

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-8">
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl overflow-x-auto no-scrollbar">
                {activeTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 md:px-6 py-2 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                            activeTab === tab.id
                                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                                : "text-neutral-500 hover:text-white hover:bg-white/5",
                        )}
                    >
                        <tab.icon size={14} className={cn("shrink-0", activeTab === tab.id ? "text-slate-950" : "text-neutral-500")} />
                        {tab.label}
                        {tab.id === "cast" && cast.length > 0 && (
                            <span className={cn("ml-0.5 px-1.5 py-0.2 rounded-md text-[8px] md:text-[9px] font-bold", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {cast.length}
                            </span>
                        )}
                        {tab.id === "seasons" && seasons?.length ? (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {seasons.length}
                            </span>
                        ) : null}
                        {tab.id === "comments" && initialComments.length > 0 && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {initialComments.length}
                            </span>
                        )}
                        {tab.id === "similar" && recommendations.length > 0 && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {recommendations.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "cast" && <CastList cast={cast} />}

                {activeTab === "seasons" && (
                    <SeasonList
                        seasons={seasons || []}
                        tmdbId={tmdbId}
                        watchedEpisodes={watchedEpisodes}
                    />
                )}

                {activeTab === "heatmap" && (
                    <TvHeatmap
                        tmdbId={tmdbId}
                        seasons={seasons || []}
                    />
                )}

                {activeTab === "comments" && (
                    <CommentsSection
                        mediaId={tmdbId}
                        type={type}
                        initialComments={initialComments}
                        mediaTitle={title}
                        mediaPosterPath={posterPath}
                        currentUserId={currentUserId}
                        director={director}
                        producer={producer}
                    />
                )}

                {activeTab === "similar" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 md:px-0">
                        {recommendationsLoading && recommendations.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-neutral-500 text-sm font-medium">
                                Benzer içerikler yükleniyor...
                            </div>
                        ) : recommendations.length > 0 ? (
                            recommendations.slice(0, 18).map((item) => (
                                <MediaCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title || item.name || ""}
                                    originalTitle={item.original_title || item.original_name}
                                    posterPath={item.poster_path ?? null}
                                    voteAverage={item.vote_average ?? 0}
                                    releaseDate={item.release_date || item.first_air_date}
                                    type={type}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-neutral-500 text-sm font-medium">
                                Bu içerik için benzer öneri bulunamadı.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
