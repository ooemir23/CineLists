"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { Plus, Check, Loader2, Eye, ChevronDown, ChevronUp, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { RecommendModal } from "./recommend-modal";
import { toggleToWatch } from "@/lib/actions";
import { toggleWatchedStatus, setWatchStatus } from "@/lib/activity-actions";
import { cn } from "@/lib/utils";
import { WatchDetailsForm } from "./watch-details-form";
import { toast } from "sonner";

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
    isAuthenticated?: boolean;
    isGuest?: boolean;
    variant?: "standard" | "minimal";
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
    isAuthenticated,
    isGuest,
    variant = "standard"
}: MediaActionsProps) {
    const [status, setStatus] = useState<string | null>(initialStatus || null);
    const [showDetailsForm, setShowDetailsForm] = useState(false);
    const [isRecommendOpen, setIsRecommendOpen] = useState(false);
    const [userRating, setUserRating] = useState(initialRating || 0);
    const [guestWarning, setGuestWarning] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLDivElement>(null);
    const isRestrictedUser = !isAuthenticated || isGuest;

    const showAuthWarning = (message: string) => {
        setGuestWarning(message);
        setTimeout(() => setGuestWarning(null), 3000);
    };

    const handleToggleWatchlist = () => {
        if (isRestrictedUser) {
            showAuthWarning("Listeye eklemek için kayıt olmalısın!");
            return;
        }

        const oldStatus = status;
        const newStatus = status === "PLAN_TO_WATCH" ? null : "PLAN_TO_WATCH";
        setStatus(newStatus);

        startTransition(async () => {
            const result = await toggleToWatch(tmdbId, type, title, posterPath);
            if (result.error) {
                setStatus(oldStatus);
                toast.error(result.error);
            } else {
                toast.success(newStatus ? "Listeye eklendi" : "Listeden çıkarıldı");
            }
        });
    };

    const handleMarkWatching = () => {
        if (isRestrictedUser) {
            showAuthWarning("İzlemeye başlamak için kayıt olmalısın!");
            return;
        }

        const oldStatus = status;
        const newStatus = status === "WATCHING" ? "PLAN_TO_WATCH" : "WATCHING";
        setStatus(newStatus);

        startTransition(async () => {
            const result = await setWatchStatus(tmdbId, type, title, posterPath, newStatus === "WATCHING" ? "WATCHING" : "PLAN_TO_WATCH");
            if (result.error) {
                setStatus(oldStatus);
                toast.error(result.error);
            } else {
                toast.success(newStatus === "WATCHING" ? "İzleniyor olarak işaretlendi" : "İzleme listesine geri alındı");
            }
        });
    };

    const handleMarkWatched = () => {
        if (isRestrictedUser) {
            showAuthWarning("İzledim olarak işaretlemek için kayıt olmalısın!");
            return;
        }

        const oldStatus = status;
        const isWatched = status === "COMPLETED";
        const newStatus = isWatched ? "PLAN_TO_WATCH" : "COMPLETED";
        setStatus(newStatus);

        if (newStatus === "COMPLETED") {
            setShowDetailsForm(true);
        } else {
            setShowDetailsForm(false);
        }

        startTransition(async () => {
            const result = await toggleWatchedStatus(tmdbId, type, title, posterPath);
            if (result.error) {
                setStatus(oldStatus);
                if (!isWatched) setShowDetailsForm(false);
                toast.error(result.error);
            } else {
                toast.success(newStatus === "COMPLETED" ? "İzlenenlere eklendi" : "İzlenenlerden çıkarıldı");
            }
        });
    };

    const isMinimal = variant === "minimal";

    return (
        <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className={cn("flex flex-wrap gap-3", isMinimal ? "justify-center md:justify-start" : "")}>
                {/* Watchlist (Takip Et) Button */}
                <button
                    onClick={handleToggleWatchlist}
                    disabled={isPending || status === "COMPLETED" || status === "WATCHING"}
                    className={cn(
                        "flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-lg backdrop-blur-md",
                        isMinimal
                            ? "px-5 py-3 rounded-2xl text-sm border hover:bg-white/20"
                            : "px-6 py-3 rounded-xl",
                        status === "PLAN_TO_WATCH"
                            ? (isMinimal ? "bg-amber-400/20 text-amber-400 border-amber-400/30 shadow-amber-900/20" : "bg-amber-400 text-slate-900 hover:bg-amber-500 shadow-amber-500/25")
                            : (status === "COMPLETED" || status === "WATCHING")
                                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border-transparent"
                                : (isMinimal ? "bg-white/10 text-white border-white/10" : "bg-white/10 text-white hover:bg-white/20 border-white/10 shadow-black/25 hover:scale-105")
                    )}
                >
                    {status === "PLAN_TO_WATCH" ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                    <span className={cn(isMinimal && "font-semibold")}>
                        {status === "PLAN_TO_WATCH" ? "Takiptesin" : "Takip Et"}
                    </span>
                </button>

                {/* Watching (İzlemeye Başladım) Button */}
                <button
                    onClick={handleMarkWatching}
                    disabled={isPending || status === "COMPLETED"}
                    className={cn(
                        "flex items-center justify-center gap-2 font-bold transition-all active:scale-95 border-2 backdrop-blur-md",
                        isMinimal
                            ? "px-5 py-3 rounded-2xl text-sm border-white/5"
                            : "px-6 py-3 rounded-xl",
                        status === "WATCHING"
                            ? (isMinimal ? "bg-sky-500/20 text-sky-400 border-sky-500/30" : "bg-sky-500 text-white border-sky-600 shadow-sky-500/25")
                            : (isMinimal ? "bg-white/10 text-white border-transparent hover:bg-white/20" : "bg-white/5 text-white border-white/10 hover:bg-white/10")
                    )}
                >
                    <Eye className={cn("w-5 h-5", status === "WATCHING" && "animate-pulse")} />
                    <span className={cn(isMinimal && "font-semibold")}>
                        {status === "WATCHING" ? "İzleniyor" : "İzliyorum"}
                    </span>
                </button>

                {/* Watched Button */}
                <button
                    onClick={handleMarkWatched}
                    disabled={isPending}
                    className={cn(
                        "flex items-center justify-center gap-2 font-bold transition-all active:scale-95 border-2 backdrop-blur-md",
                        isMinimal
                            ? "px-5 py-3 rounded-2xl text-sm border-white/5"
                            : "px-6 py-3 rounded-xl",
                        status === "COMPLETED"
                            ? (isMinimal ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25")
                            : (isMinimal ? "bg-white/10 text-white border-transparent hover:bg-white/20" : "bg-white/5 text-white border-white/10 hover:bg-white/10")
                    )}
                >
                    <Check className={cn("w-5 h-5", status === "COMPLETED" && "scale-110")} />
                    <span className={cn(isMinimal && "font-semibold")}>
                        {status === "COMPLETED" ? "İzlendi" : "İzledim"}
                    </span>
                </button>

                {/* Minimal Layout: Hide extra buttons in the main row or make them icon-only */}
                {!isMinimal && (
                    <>
                        {status === "COMPLETED" && (
                            <button
                                onClick={() => setShowDetailsForm(!showDetailsForm)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 font-medium rounded-xl transition-all border text-xs",
                                    showDetailsForm ? "bg-white/10 border-white/20" : "bg-transparent border-white/5 hover:bg-white/5"
                                )}
                            >
                                {showDetailsForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {showDetailsForm ? "Kapat" : "Detay"}
                            </button>
                        )}

                        <Link
                            href="#comments"
                            className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors text-sm font-bold border border-white/5"
                        >
                            <MessageSquare className="w-4 h-4 text-amber-400" />
                            <span className="hidden sm:inline">Yorum</span>
                        </Link>
                    </>
                )}

                {/* Recommend Button - Always visible but styled differently */}
                <button
                    onClick={() => {
                        if (isRestrictedUser) {
                            showAuthWarning("Tavsiye etmek için kayıt olmalısın!");
                            return;
                        }
                        setIsRecommendOpen(true);
                    }}
                    className={cn(
                        "transition-colors border backdrop-blur-md text-neutral-400 hover:text-white flex items-center justify-center",
                        isMinimal
                            ? "w-11 h-11 rounded-2xl bg-white/10 border-white/10 hover:bg-white/20"
                            : "p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl border-white/5"
                    )}
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {guestWarning && (
                <div className="bg-amber-400/10 border border-amber-400/20 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold animate-in slide-in-from-top-1 duration-300 flex items-center justify-between">
                    <span>{guestWarning}</span>
                    <div className="flex gap-2 ml-2">
                        <Link href="/login" className="bg-white/10 text-white px-2 py-1 rounded-md hover:bg-white/20 transition-all scale-90 border border-white/10">Giriş Yap</Link>
                        <Link href="/register" className="bg-amber-400 text-slate-900 px-2 py-1 rounded-md hover:bg-amber-500 transition-all scale-90 shadow-lg shadow-amber-400/20 font-bold text-[10px] uppercase tracking-wider">Kayıt Ol</Link>
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
