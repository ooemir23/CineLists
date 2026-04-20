"use client";

import { useRef, useEffect, useState } from "react";
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
    autoScroll?: boolean; // Auto-scroll toggle
};

export function MediaRowClient({ children, autoScroll = true }: MediaRowClientProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isPaused = useRef(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const slider = scrollRef.current;
        if (!slider || !mounted || !autoScroll) return;

        let animationFrameId: number;
        let lastTimestamp = 0;

        // Even slower, premium speed: ~30 pixels per second
        const pixelsPerSecond = 30;

        const animateScroll = (timestamp: number) => {
            if (isPaused.current) {
                lastTimestamp = timestamp;
                animationFrameId = requestAnimationFrame(animateScroll);
                return;
            }

            if (lastTimestamp === 0) {
                lastTimestamp = timestamp;
            }

            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;
            const maxScroll = slider.scrollWidth / 2; // Half because content is duplicated

            slider.scrollLeft += scrollAmount;

            // Seamless infinite loop - reset when reaching halfway point
            if (slider.scrollLeft >= maxScroll) {
                slider.scrollLeft = slider.scrollLeft - maxScroll;
            }

            animationFrameId = requestAnimationFrame(animateScroll);
        };

        animationFrameId = requestAnimationFrame(animateScroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, [mounted, autoScroll]);

    // Duplicate children for infinite loop effect
    const duplicatedChildren = (
        <>
            {children}
            {children}
        </>
    );

    return (
        <div
            className="relative group/slider"
            onMouseEnter={() => (isPaused.current = true)}
            onMouseLeave={() => (isPaused.current = false)}
            onTouchStart={() => (isPaused.current = true)}
            onTouchEnd={() => {
                // Resume auto-scroll after a delay on touch end
                setTimeout(() => { isPaused.current = false; }, 3000);
            }}
        >
            <div
                ref={scrollRef}
                className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pt-2 pb-4 md:pt-12 md:pb-14 -mx-1 px-1 sm:-mx-4 sm:px-4 md:-mx-4 md:px-4 hide-scrollbar snap-x snap-mandatory"
                style={{ scrollBehavior: 'auto' }}
            >
                {duplicatedChildren}
            </div>
        </div>
    );
}

// Re-export MediaCard and supporting types for easier imports if needed
export { MediaCard };
export type { MediaItem };
