"use client";

import { useState } from "react";
import { Play, VideoOff } from "lucide-react";
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

    const trailer = videos?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) || videos?.[0];
    const hasTrailer = !!trailer?.key;

    if (!hasTrailer) {
        return (
            <div className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.03] border border-white/8 border-dashed rounded-2xl text-white/25 cursor-not-allowed select-none",
                className
            )}>
                <VideoOff size={14} />
                <span className="text-xs font-black uppercase tracking-wider">Fragman Yok</span>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-amber-400/10 border border-white/10 hover:border-amber-400/30 rounded-2xl text-white font-black uppercase text-xs tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] group",
                    className
                )}
            >
                <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Play size={12} className="text-slate-950 fill-current ml-0.5" />
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
