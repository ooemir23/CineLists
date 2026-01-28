"use client";

import { useState } from "react";
import { ChevronRight as ArrowRight } from "lucide-react";
import { MediaCard } from "./media-card";
import { cn } from "@/lib/utils";

type MediaItem = {
    id: number;
    title?: string;
    original_title?: string;
    name?: string; // TV shows use name
    original_name?: string;
    poster_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    runtime?: number; // Added runtime support
};

type MediaRowClientProps = {
    children: React.ReactNode;
};

export function MediaRowClient({ children }: MediaRowClientProps) {
    return (
        <div className="relative group/slider">
            <div className="flex gap-4 lg:gap-6 overflow-x-auto pt-4 pb-6 -mx-8 px-8 md:-mx-4 md:px-4 snap-x hide-scrollbar">
                {children}
            </div>

            {/* Fade gradients for overflow indication */}
            <div className="absolute top-0 bottom-6 left-0 w-12 bg-gradient-to-r from-[#101624] to-transparent pointer-events-none md:hidden" />
            <div className="absolute top-0 bottom-6 right-0 w-12 bg-gradient-to-l from-[#101624] to-transparent pointer-events-none md:hidden" />
        </div>
    );
}

// Re-export MediaCard and supporting types for easier imports if needed
export { MediaCard };
export type { MediaItem };
