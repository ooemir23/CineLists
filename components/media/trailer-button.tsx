"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { TrailerModal } from "./trailer-modal";
import { cn } from "@/lib/utils";

type Video = {
    key: string;
    site: string;
    type: string;
};

type TrailerButtonProps = {
    videos: Video[];
    title: string;
    className?: string;
};

export function TrailerButton({ videos, title, className }: TrailerButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Find the primary trailer (YouTube, Type: Trailer)
    const trailer = videos?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) || videos?.[0];

    if (!trailer?.key) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "w-full mt-4 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] group",
                    className
                )}
            >
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20 group-hover:scale-110 transition-transform">
                    <Play size={14} className="text-slate-950 fill-current ml-0.5" />
                </div>
                <span>Fragman İzle</span>
            </button>

            <TrailerModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                videoKey={trailer.key}
                title={title}
            />
        </>
    );
}
