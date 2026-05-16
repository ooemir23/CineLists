"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { CompactActivityCard } from "@/components/feed/compact-activity-card";

type Activity = {
    id: string;
    type: "WATCHED" | "RATED" | "REVIEWED" | "COMMENTED" | "LISTED";
    createdAt: Date;
    rating: number | null;
    review: string | null;
    votes: number;
    watchedWith: string | null;
    recommendedByText: string | null;
    recommendedBy?: {
        id: string;
        name: string | null;
    } | null;
    platform?: string | null;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    media: {
        tmdbId: number;
        title: string;
        posterPath: string | null;
        backdropPath: string | null;
        type: "MOVIE" | "TV" | "PERSON";
        runtime?: number | null;
    };
    episode?: {
        id: string;
        seasonNumber: number;
        episodeNumber: number;
        title: string;
    } | null;
    episodeRange?: {
        seasonNumber: number;
        fromEpisode: number;
        toEpisode: number;
        count: number;
    } | null;
    _count: {
        comments: number;
    };
};

type ActivityApi = Omit<Activity, "createdAt"> & {
    createdAt: string;
};

export function LazyFriendsActivityPanel() {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node || isVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible || isLoading || activities.length > 0) return;

        const controller = new AbortController();

        const load = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/home/friends-activity?maxItems=6", {
                    signal: controller.signal,
                    cache: "force-cache",
                });

                if (!res.ok) return;

                const data: { results?: ActivityApi[] } = await res.json();
                const nextActivities = (data.results || []).map((item) => ({
                    ...item,
                    createdAt: new Date(item.createdAt),
                }));
                setActivities(nextActivities);
            } catch {
                // Silent fallback keeps the panel lightweight.
            } finally {
                setIsLoading(false);
            }
        };

        load();
        return () => controller.abort();
    }, [activities.length, isLoading, isVisible]);

    return (
        <div ref={ref} className="bg-[#1A202C]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full min-h-[520px]">
            <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                <Link href="/feed" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                        <Rss className="w-4 h-4 text-primary group-hover:text-black transition-colors" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-white tracking-tight uppercase group-hover:text-primary transition-colors leading-tight">Akış</h3>
                        <p className="text-[8px] text-neutral-500 font-bold tracking-widest uppercase leading-tight">Arkadaşların</p>
                    </div>
                </Link>

                <Link
                    href="/feed"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all hover:scale-110 flex-shrink-0"
                    title="Tümünü Gör"
                >
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-[#1A202C]/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-[#1A202C]/60 to-transparent z-10 pointer-events-none" />

                <div className="p-3 space-y-3">
                    {!isVisible ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="h-32 rounded-2xl bg-white/5" />
                            ))}
                        </div>
                    ) : isLoading && activities.length === 0 ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="h-32 rounded-2xl bg-white/5" />
                            ))}
                        </div>
                    ) : activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id}>
                                <CompactActivityCard activity={activity} />
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <div className="p-4 bg-white/5 rounded-full mb-4">
                                <Rss className="w-8 h-8 text-neutral-500" />
                            </div>
                            <p className="text-neutral-400 text-sm">
                                Henüz bir aktivite yok. Arkadaşlarını takip ederek akışını canlandır!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
