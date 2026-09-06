"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AutoScrollTextProps {
    text: string;
    className?: string;
    speed?: number; // duration in seconds
}

export function AutoScrollText({ text, className, speed = 10 }: AutoScrollTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            if (textRef.current) {
                // Check if the scroll width (content) is larger than the client width (visible)
                const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth;
                setShouldScroll(isOverflowing);
            }
        };

        // Small timeout to ensure layout is computed
        const timer = setTimeout(checkScroll, 100);
        window.addEventListener("resize", checkScroll);

        return () => {
            window.removeEventListener("resize", checkScroll);
            clearTimeout(timer);
        };
    }, [text]);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden w-full group/text", className)}
        >
            {shouldScroll ? (
                // Marquee: Two copies of the text container
                <div
                    className="flex w-fit animate-marquee-infinite hover:[animation-play-state:running] [animation-play-state:paused]"
                    style={{ animationDuration: `${speed || Math.max(10, text.length * 0.5)}s` }} // Dynamic speed based on length
                >
                    <span className="whitespace-nowrap pr-8">
                        {text}
                    </span>
                    <span className="whitespace-nowrap pr-8">
                        {text}
                    </span>
                </div>
            ) : (
                // Static version
                <span ref={textRef} className="block truncate whitespace-nowrap">
                    {text}
                </span>
            )}
        </div>
    );
}
