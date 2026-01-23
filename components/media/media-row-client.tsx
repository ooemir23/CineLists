"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MediaRowClientProps = {
    children: React.ReactNode;
};

export function MediaRowClient({ children }: MediaRowClientProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    return (
        <div className="relative group/row">
            <button
                onClick={() => scroll("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all opacity-0 group-hover/row:opacity-100 hidden md:block"
            >
                <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
                onClick={() => scroll("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all opacity-0 group-hover/row:opacity-100 hidden md:block"
            >
                <ChevronRight className="w-5 h-5 text-white" />
            </button>

            <div
                ref={rowRef}
                className="flex gap-4 overflow-x-auto px-6 md:px-10 pb-4 scrollbar-hide snap-x scroll-pl-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>
        </div>
    );
}
