"use client";

import { useTransition, useState } from "react";
import { Plus, Check, Loader2, Eye } from "lucide-react";
import { toggleWatchlist } from "@/lib/actions";
import { toggleWatchedStatus } from "@/lib/activity-actions";
import { rateMedia } from "@/lib/rating-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RatingInput } from "./rating-input";

type MediaActionsProps = {
    tmdbId: number;
    type: "movie" | "tv";
    title: string;
    posterPath: string | null;
    initialInWatchlist: boolean;
    initialStatus?: string | null;
    initialRating?: number | null;
};

export function MediaActions({ tmdbId, type, title, posterPath, initialInWatchlist, initialStatus, initialRating }: MediaActionsProps) {
    const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
    const [isWatched, setIsWatched] = useState(initialStatus === "COMPLETED");
    const [showRating, setShowRating] = useState(false);
    const [userRating, setUserRating] = useState(initialRating || 0);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggleWatchlist = () => {
        setInWatchlist((prev) => !prev);
        startTransition(async () => {
            const result = await toggleWatchlist(tmdbId, type, title, posterPath);
            if (result.error) router.push("/login");
        });
    };

    const handleMarkWatched = () => {
        // Optimistic update
        const newStatus = !isWatched;
        setIsWatched(newStatus);

        if (newStatus) {
            setInWatchlist(true);
            setShowRating(true);
        } else {
            setShowRating(false);
        }

        startTransition(async () => {
            const result = await toggleWatchedStatus(tmdbId, type, title, posterPath);
            if (result.error) {
                // Revert on error
                setIsWatched(!newStatus);
                if (newStatus) setShowRating(false);
                router.push("/login");
            } else if (result.success && typeof result.isWatched === 'boolean') {
                // Sync with server result just in case
                setIsWatched(result.isWatched);
            }
        });
    };

    const handleRate = (rating: number) => {
        setUserRating(rating);
        startTransition(async () => {
            await rateMedia(tmdbId, type, rating);
        });
    };

    return (
        <div className="relative flex flex-col gap-4">
            <div className="flex gap-3">
                <button
                    onClick={handleToggleWatchlist}
                    disabled={isPending}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all shadow-lg active:scale-95",
                        inWatchlist
                            ? "bg-green-500 text-white hover:bg-green-600 shadow-green-500/25"
                            : "bg-primary text-white hover:bg-primary/90 shadow-primary/25 hover:scale-105"
                    )}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : inWatchlist ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                    {inWatchlist ? "Listede" : "Listeye Ekle"}
                </button>

                <button
                    onClick={handleMarkWatched}
                    disabled={isPending}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all border",
                        isWatched
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/50 cursor-default"
                            : "bg-neutral-800 text-white hover:bg-neutral-700 border-white/5 hover:scale-105 active:scale-95"
                    )}
                >
                    <Eye className="w-5 h-5" />
                    {isWatched ? "İzlendi" : "İzlendi İşaretle"}
                </button>
            </div>

            {(showRating || userRating > 0) && (
                <div className="absolute bottom-full left-0 mb-4 z-50 animate-in fade-in slide-in-from-bottom-2 origin-bottom">
                    <RatingInput onRate={handleRate} initialRating={userRating} />
                </div>
            )}
        </div>
    );
}
