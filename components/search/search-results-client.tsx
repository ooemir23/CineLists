"use client";

import { useState } from "react";
import { MediaCard } from "@/components/media/media-card";
import { cn } from "@/lib/utils";

type SearchResultsClientProps = {
    people: any[];
    mediaItems: any[];
    userRatingsMap: Record<number, number>;
    communityRatingsMap: Record<number, { average: number; count: number }>;
    metadataMap: Record<number, any>;
    type: string;
};

export function SearchResultsClient({
    people,
    mediaItems,
    userRatingsMap,
    communityRatingsMap,
    metadataMap,
    type
}: SearchResultsClientProps) {
    const [activeTab, setActiveTab] = useState<"content" | "artists">("content");

    return (
        <div className="space-y-8">
            {/* Tabs Header */}
            <div className="flex items-center gap-8 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab("content")}
                    className="relative group flex flex-col items-start gap-1 outline-none"
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-1.5 h-6 rounded-full transition-all duration-300",
                            activeTab === "content" ? "bg-primary shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-neutral-700"
                        )} />
                        <h2 className={cn(
                            "text-2xl md:text-3xl font-black uppercase tracking-tight transition-colors duration-300",
                            activeTab === "content" ? "text-white" : "text-neutral-500 group-hover:text-neutral-400"
                        )}>
                            İçerikler
                        </h2>
                        <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full border transition-all duration-300",
                            activeTab === "content" ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-neutral-500"
                        )}>
                            {mediaItems.length}
                        </span>
                    </div>
                    {activeTab === "content" && (
                        <div className="absolute -bottom-[17px] left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    )}
                </button>

                {people.length > 0 && (
                    <button
                        onClick={() => setActiveTab("artists")}
                        className="relative group flex flex-col items-start gap-1 outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-1.5 h-6 rounded-full transition-all duration-300",
                                activeTab === "artists" ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-neutral-700"
                            )} />
                            <h2 className={cn(
                                "text-2xl md:text-3xl font-black uppercase tracking-tight transition-colors duration-300",
                                activeTab === "artists" ? "text-white" : "text-neutral-500 group-hover:text-neutral-400"
                            )}>
                                Sanatçılar
                            </h2>
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full border transition-all duration-300",
                                activeTab === "artists" ? "bg-amber-400/20 border-amber-400/30 text-amber-400" : "bg-white/5 border-white/10 text-neutral-500"
                            )}>
                                {people.length}
                            </span>
                        </div>
                        {activeTab === "artists" && (
                            <div className="absolute -bottom-[17px] left-0 right-0 h-1 bg-amber-400 rounded-t-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                        )}
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "content" ? (
                    mediaItems.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4 pt-4">
                            {mediaItems.map((item: any) => (
                                <MediaCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title || item.name}
                                    originalTitle={item.original_title || item.original_name}
                                    posterPath={item.poster_path || item.profile_path}
                                    voteAverage={item.vote_average || 0}
                                    userRating={userRatingsMap[item.id]}
                                    communityRating={communityRatingsMap[item.id]}
                                    runtime={metadataMap[item.id]?.runtime || undefined}
                                    type={(item.media_type || type) as "movie" | "tv"}
                                    fullWidth={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                            <p className="text-lg font-medium">Bu kategoride içerik bulunamadı.</p>
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4 pt-4">
                        {people.map((item: any) => (
                            <div key={item.id} className="transform hover:scale-110 transition-transform duration-300 hover:z-10">
                                <MediaCard
                                    id={item.id}
                                    title={item.title || item.name}
                                    originalTitle={item.original_title || item.original_name}
                                    posterPath={item.poster_path || item.profile_path}
                                    voteAverage={item.vote_average || 0}
                                    type="person"
                                    fullWidth={true}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
