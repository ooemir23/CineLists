"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "./media-card";

type MediaItem = {
    id: number;
    title?: string;
    name?: string; // TV shows use name
    poster_path: string | null;
    vote_average: number;
};

type MediaRowProps = {
    title: string;
    items: MediaItem[];
    type: "movie" | "tv";
};

export function MediaRow({ title, items, type }: MediaRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    return (
        <div className="py-6 space-y-4">
            <div className="flex items-center justify-between px-6 md:px-10">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
                <div className="flex gap-2">
                    <button onClick={() => scroll("left")} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors hidden md:block">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => scroll("right")} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors hidden md:block">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={rowRef}
                className="flex gap-4 overflow-x-auto px-6 md:px-10 pb-4 scrollbar-hide snap-x scroll-pl-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item) => (
                    <MediaCard
                        key={item.id}
                        id={item.id}
                        title={item.title || item.name || "Bilinmiyor"}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        type={type}
                    />
                ))}
            </div>
        </div>
    );
}
