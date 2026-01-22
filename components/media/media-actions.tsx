"use client";

import { useTransition, useState } from "react";
import { Plus, Check, Loader2, Eye } from "lucide-react";
import { toggleWatchlist } from "@/lib/actions";
import { markAsWatched } from "@/lib/activity-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type MediaActionsProps = {
    tmdbId: number;
    type: "movie" | "tv";
    title: string;
    posterPath: string | null;
    initialInWatchlist: boolean;
    initialStatus?: string | null;
};

export function MediaActions({ tmdbId, type, title, posterPath, initialInWatchlist, initialStatus }: MediaActionsProps) {
    const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
    const [isWatched, setIsWatched] = useState(initialStatus === "COMPLETED");
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
        if (isWatched) return; // Undo implementation is complex, skip for now or implement later
        setIsWatched(true);
        setInWatchlist(true); // If watched, it's in list/history

        startTransition(async () => {
            const result = await markAsWatched(tmdbId, type, title, posterPath);
            if (result.error) {
                setIsWatched(false);
                router.push("/login");
            }
        });
    }

    return (
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
                disabled={isPending || isWatched}
                className={cn(
                    "flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all border",
                    isWatched
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/50 cursor-default"
                        : "bg-white/10 text-white hover:bg-white/20 border-white/5 hover:scale-105 active:scale-95"
                )}
            >
                <Eye className="w-5 h-5" />
                {isWatched ? "İzlendi" : "İzlendi İşaretle"}
            </button>
        </div>
    );
}
