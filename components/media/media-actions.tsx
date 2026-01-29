"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { Plus, Check, Loader2, Eye, ChevronDown, ChevronUp, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { RecommendModal } from "./recommend-modal";
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
    initialRecommendation?: {
        id: string;
        name: string;
    } | null;
    isGuest?: boolean;
};

export function MediaActions({
    tmdbId,
    type,
    title,
    posterPath,
    initialInWatchlist,
    initialStatus,
    initialRating,
    initialRecommendation,
    isGuest
}: MediaActionsProps) {
    const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
    const [isWatched, setIsWatched] = useState(initialStatus === "COMPLETED");
    const [showDetailsForm, setShowDetailsForm] = useState(false);
    const [isRecommendOpen, setIsRecommendOpen] = useState(false);
    const [userRating, setUserRating] = useState(initialRating || 0);
    const [guestWarning, setGuestWarning] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showDetailsForm && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [showDetailsForm]);

    const handleToggleWatchlist = () => {
        if (isGuest) {
            setGuestWarning("Listeye eklemek için kayıt olmalısın!");
            setTimeout(() => setGuestWarning(null), 3000);
            return;
        }
        setInWatchlist((prev) => !prev);
        startTransition(async () => {
            const result = await toggleToWatch(tmdbId, type, title, posterPath);
            if (result.error) router.push("/login");
        });
    };

    const handleMarkWatched = () => {
        if (isGuest) {
            setGuestWarning("İzlendi işaretlemek için kayıt olmalısın!");
            setTimeout(() => setGuestWarning(null), 3000);
            return;
        }
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
                            "flex items-center gap-2 px-4 py-3 font-medium rounded-xl transition-all border text-xs",
                            showDetailsForm ? "bg-white/10 border-white/20" : "bg-transparent border-white/5 hover:bg-white/5"
                        )}
                    >
                        {showDetailsForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showDetailsForm ? "Detayları Kapat" : "İzleme Detayları"}
                    </button>
                )}

                <Link
                    href="#comments"
                    className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors text-sm font-bold border border-white/5"
                >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">Yorum</span>
                </Link>

                <button
                    onClick={() => {
                        if (isGuest) {
                            setGuestWarning("Tavsiye etmek için kayıt olmalısın!");
                            setTimeout(() => setGuestWarning(null), 3000);
                            return;
                        }
                        setIsRecommendOpen(true);
                    }}
                    className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors border border-white/5 text-neutral-400 hover:text-white"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {guestWarning && (
                <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-xs font-bold animate-in slide-in-from-top-1 duration-300 flex items-center justify-between">
                    <span>{guestWarning}</span>
                    <div className="flex gap-2 ml-2">
                        <Link href="/login" className="bg-white/10 text-white px-2 py-1 rounded-md hover:bg-white/20 transition-all scale-90 border border-white/10">Giriş Yap</Link>
                        <Link href="/register" className="bg-primary text-white px-2 py-1 rounded-md hover:bg-primary/90 transition-all scale-90 shadow-lg shadow-primary/20">Kayıt Ol</Link>
                    </div>
                </div>
            )}

            {isRecommendOpen && (
                <RecommendModal
                    mediaId={tmdbId}
                    title={title}
                    type={type}
                    posterPath={posterPath}
                    onClose={() => setIsRecommendOpen(false)}
                />
            )}

            {showDetailsForm && (
                <div ref={formRef} className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <WatchDetailsForm
                        tmdbId={tmdbId}
                        type={type}
                        title={title}
                        posterPath={posterPath}
                        initialRating={userRating}
                        initialRecommendation={initialRecommendation}
                        isGuest={isGuest}
                        onClose={() => setShowDetailsForm(false)}
                        onSaveSuccess={() => {
                            // Success handling
                        }}
                    />
                </div>
            )}
        </div>
    );
}
