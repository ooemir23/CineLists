"use client";

import React, { useState, useEffect } from "react";
import { Users, LayoutGrid, MessageSquare, Plus, Star, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CastList } from "./cast-list";
import SeasonList from "./season-list";
import { CommentsSection } from "./comments";
import { MediaCard } from "./media-card";
import { TvHeatmap } from "./tv-heatmap";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Tab = "cast" | "seasons" | "comments" | "similar" | "heatmap";

interface DetailTabsProps {
    type: "movie" | "tv";
    tmdbId: number;
    title: string;
    posterPath?: string | null;
    cast: any[];
    seasons?: any[];
    recommendations: any[];
    watchedEpisodes: any[];
    initialComments: any[];
    currentUserId?: string;
    director?: string;
    producer?: string;
}

const TABS: { id: Tab; label: string; icon: any; condition?: boolean }[] = [
    { id: "cast", label: "Oyuncular", icon: Users },
    { id: "seasons", label: "Sezonlar", icon: LayoutGrid },
    { id: "heatmap", label: "Puan Haritası", icon: Grid3X3, condition: true },
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
    recommendations,
    watchedEpisodes,
    initialComments,
    currentUserId,
    director,
    producer,
}: DetailTabsProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    // Sync active tab with URL search param
    const queryTab = searchParams.get("tab") as Tab;
    const initialTab = queryTab && TABS.find(t => t.id === queryTab) ? queryTab : (type === "tv" && seasons && seasons.length > 0 ? "seasons" : "cast");
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    useEffect(() => {
        if (queryTab && TABS.find(t => t.id === queryTab)) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);

    const handleTabChange = (tabId: Tab) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const activeTabs = TABS.filter(t => {
        if (t.id === "seasons") return type === "tv" && seasons && seasons.length > 0;
        if (t.id === "heatmap") return type === "tv" && seasons && seasons.length > 0;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl overflow-x-auto no-scrollbar">
                {activeTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                            activeTab === tab.id
                                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                                : "text-neutral-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? "text-slate-950" : "text-neutral-500"} />
                        {tab.label}
                        {(tab.id === "cast" && cast.length > 0) && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {cast.length}
                            </span>
                        )}
                        {(tab.id === "seasons" && seasons?.length) && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {seasons.length}
                            </span>
                        )}
                        {(tab.id === "comments" && initialComments.length > 0) && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {initialComments.length}
                            </span>
                        )}
                        {(tab.id === "similar" && recommendations.length > 0) && (
                            <span className={cn("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", activeTab === tab.id ? "bg-slate-950/20" : "bg-white/5")}>
                                {recommendations.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
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
                        {recommendations.slice(0, 18).map((item) => (
                            <MediaCard
                                key={item.id}
                                id={item.id}
                                title={item.title || item.name}
                                originalTitle={item.original_title || item.original_name}
                                posterPath={item.poster_path}
                                voteAverage={item.vote_average}
                                releaseDate={item.release_date || item.first_air_date}
                                type={type}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
