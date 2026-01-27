"use client";

import { Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRatingBadgeProps = {
    rating: number | null;
    friendsCount: number;
    onClick: () => void;
};

export function UserRatingBadge({ rating, friendsCount, onClick }: UserRatingBadgeProps) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-2.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 hover:border-primary/40 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/5"
        >
            <div className="flex items-center gap-1.5 border-r border-primary/20 pr-2.5">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-sm font-black text-white">{rating ? rating.toFixed(1) : "-"}</span>
            </div>

            <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                {friendsCount > 0 && (
                    <span className="text-[11px] font-bold text-neutral-300 group-hover:text-white transition-colors">
                        {friendsCount}
                    </span>
                )}
            </div>
        </button>
    );
}
