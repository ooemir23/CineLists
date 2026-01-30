"use client";

import { useRef, useEffect } from "react";
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const isPaused = useRef(false);

    useEffect(() => {
        const slider = scrollRef.current;
        if (!slider) return;

        const autoScroll = setInterval(() => {
            if (isPaused.current) return;

            const scrollAmount = 1; // Pixels per interval for smooth movement
            const maxScroll = slider.scrollWidth - slider.clientWidth;

            if (slider.scrollLeft >= maxScroll - 1) {
                // Smoothly reset to beginning
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollLeft += scrollAmount;
            }
        }, 30); // Interval in ms

        return () => clearInterval(autoScroll);
    }, []);

    return (
        <div
            className="relative group/slider"
            onMouseEnter={() => (isPaused.current = true)}
            onMouseLeave={() => (isPaused.current = false)}
        >
            <div
                ref={scrollRef}
                className="flex gap-4 lg:gap-6 overflow-x-auto pt-10 pb-12 -mx-8 px-8 md:-mx-4 md:px-4 snap-x hide-scrollbar"
                style={{ scrollBehavior: 'auto' }} // Keep manual scrolling responsive
            >
                {children}
            </div>

            {/* Fade gradients for overflow indication */}
            <div className="absolute top-0 bottom-6 left-0 w-24 bg-gradient-to-r from-[#101624] via-[#101624]/40 to-transparent pointer-events-none z-10" />
            <div className="absolute top-0 bottom-6 right-0 w-24 bg-gradient-to-l from-[#101624] via-[#101624]/40 to-transparent pointer-events-none z-10" />
        </div>
    );
}

// Re-export MediaCard and supporting types for easier imports if needed
export { MediaCard };
export type { MediaItem };
