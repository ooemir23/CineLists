"use client";

import { useTransition, useState } from "react";
import { Plus, Check, Loader2, Eye } from "lucide-react";
import { toggleToWatch } from "@/lib/actions";
import { toggleWatchedStatus } from "@/lib/activity-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WatchDetailsForm } from "./watch-details-form";

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
    const [showDetailsForm, setShowDetailsForm] = useState(false);
    const [userRating, setUserRating] = useState(initialRating || 0);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggleWatchlist = () => {
        setInWatchlist((prev) => !prev);
        startTransition(async () => {
            const result = await toggleToWatch(tmdbId, type, title, posterPath);
            if (result.error) router.push("/login");
        });
    };

    const handleMarkWatched = () => {
        // Optimistic update
        const newStatus = !isWatched;
        setIsWatched(newStatus);

        if (newStatus) {
            setInWatchlist(false); // When watched, it's removed from to-watch
            setShowDetailsForm(true);
        } else {
            setShowDetailsForm(false);
        }

        startTransition(async () => {
            const result = await toggleWatchedStatus(tmdbId, type, title, posterPath);
            if (result.error) {
                // Revert on error
                setIsWatched(!newStatus);
                if (newStatus) setShowDetailsForm(false);
                router.push("/login");
            } else if (result.success && typeof result.isWatched === 'boolean') {
                // Sync with server result just in case
                setIsWatched(result.isWatched);
            }
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleToggleWatchlist}
                    disabled={isPending || isWatched}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all shadow-lg active:scale-95",
                        inWatchlist
                            ? "bg-green-500 text-white hover:bg-green-600 shadow-green-500/25"
                            : isWatched
                                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
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
                    {inWatchlist ? "Listede" : "İzlenecek"}
                </button>

                <button
                    onClick={handleMarkWatched}
                    disabled={isPending}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all active:scale-95 border-2",
                        isWatched
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)]"
                            : "bg-neutral-800 text-white border-transparent hover:bg-neutral-700 hover:border-white/10"
                    )}
                >
                    <Check className={cn("w-5 h-5", isWatched && "scale-110")} />
                    {isWatched ? "İzlendi" : "İzledim"}
                </button>

                {isWatched && (
                    <button
                        onClick={() => setShowDetailsForm(!showDetailsForm)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 font-medium rounded-xl transition-all border text-sm",
                            showDetailsForm ? "bg-white/10 border-white/20" : "bg-transparent border-white/5 hover:bg-white/5"
                        )}
                    >
                        {showDetailsForm ? "Detayları Kapat" : "İzleme Detaylarını Düzenle"}
                    </button>
                )}
            </div>

            {showDetailsForm && (
                <WatchDetailsForm
                    tmdbId={tmdbId}
                    type={type}
                    title={title}
                    posterPath={posterPath}
                    initialRating={userRating}
                    onClose={() => setShowDetailsForm(false)}
                    onSaveSuccess={() => {
                        // Success handling
                    }}
                />
            )}
        </div>
    );
}
