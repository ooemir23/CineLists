"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRatingBadgeProps = {
    rating: number;
    onClick: () => void;
};

export function UserRatingBadge({ rating, onClick }: UserRatingBadgeProps) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl hover:border-yellow-500/50 transition-all hover:scale-105 active:scale-95"
        >
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <div className="flex flex-col items-start">
                <span className="text-xs text-neutral-400 font-medium">Senin Puanın</span>
                <span className="text-lg font-black text-yellow-400">{rating.toFixed(1)}</span>
            </div>
            <div className="ml-2 text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                Arkadaşların →
            </div>
        </button>
    );
}
