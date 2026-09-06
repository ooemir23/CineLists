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

    const handleActionError = (error: string, oldStatus: string | null, revertForm?: boolean) => {
        setStatus(oldStatus);
        if (revertForm) setShowDetailsForm(false);
        toast.error(error);
        if (error.includes("Oturum geçersiz") || error.includes("Giriş yapmalısınız")) {
            setTimeout(() => {
                window.location.href = "/login";
            }, 1200);
        }
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
                handleActionError(result.error, oldStatus);
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
        const newStatus = status === "WATCHING" ? null : "WATCHING";
        setStatus(newStatus);

        startTransition(async () => {
            const result = await setWatchStatus(tmdbId, type, title, posterPath, newStatus);
            if (result.error) {
                handleActionError(result.error, oldStatus);
            } else {
                toast.success(newStatus === "WATCHING" ? "İzleniyor olarak işaretlendi" : "İzleme listesinden çıkarıldı");
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
        const newStatus = isWatched ? null : "COMPLETED";
        setStatus(newStatus);

        if (newStatus === "COMPLETED") {
            setShowDetailsForm(true);
        } else {
            setShowDetailsForm(false);
        }

        startTransition(async () => {
            const result = await toggleWatchedStatus(tmdbId, type, title, posterPath);
            if (result.error) {
                handleActionError(result.error, oldStatus, !isWatched);
            } else {
                toast.success(newStatus === "COMPLETED" ? "İzlenenlere eklendi" : "İzlenenlerden çıkarıldı");
            }
        });
    };

    const isMinimal = variant === "minimal";

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-1.5 sm:gap-2 w-full max-w-xl">
                {/* Watchlist (Takip Et) Button */}
                <button
                    onClick={handleToggleWatchlist}
                    disabled={isPending || status === "COMPLETED" || status === "WATCHING"}
                    className={cn(
                        "h-11 px-2 sm:px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black tracking-tight transition-all active:scale-95 border backdrop-blur-md select-none",
                        status === "PLAN_TO_WATCH"
                            ? "bg-amber-400/20 text-amber-400 border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                            : (status === "COMPLETED" || status === "WATCHING")
                                ? "bg-white/[0.02] text-neutral-600 border-white/5 cursor-not-allowed"
                                : "bg-white/5 hover:bg-white/10 text-white/90 border-white/10 hover:border-white/20"
                    )}
                    title={status === "PLAN_TO_WATCH" ? "Takipten Çıkar" : "Listeye Ekle"}
                >
                    {status === "PLAN_TO_WATCH" ? (
                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                    ) : (
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                    <span className="truncate">
                        {status === "PLAN_TO_WATCH" ? "Takipte" : "Takip Et"}
                    </span>
                </button>

                {/* Watching (İzliyorum) Button */}
                <button
                    onClick={handleMarkWatching}
                    disabled={isPending || status === "COMPLETED"}
                    className={cn(
                        "h-11 px-2 sm:px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black tracking-tight transition-all active:scale-95 border backdrop-blur-md select-none",
                        status === "WATCHING"
                            ? "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                            : status === "COMPLETED"
                                ? "bg-white/[0.02] text-neutral-600 border-white/5 cursor-not-allowed"
                                : "bg-white/5 hover:bg-white/10 text-white/90 border-white/10 hover:border-white/20"
                    )}
                    title={status === "WATCHING" ? "İzlemeyi Bırak" : "İzlemeye Başladım"}
                >
                    <Eye className={cn("w-4 h-4 stroke-[2.5]", status === "WATCHING" && "animate-pulse")} />
                    <span className="truncate">
                        {status === "WATCHING" ? "İzleniyor" : "İzliyorum"}
                    </span>
                </button>

                {/* Watched (İzledim) Button */}
                <button
                    onClick={handleMarkWatched}
                    disabled={isPending}
                    className={cn(
                        "h-11 px-2 sm:px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black tracking-tight transition-all active:scale-95 border backdrop-blur-md select-none",
                        status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : "bg-white/5 hover:bg-white/10 text-white/90 border-white/10 hover:border-white/20"
                    )}
                    title={status === "COMPLETED" ? "İzlemeyi İptal Et" : "İzledim Olarak İşaretle"}
                >
                    <Check className={cn("w-4 h-4 stroke-[3]", status === "COMPLETED" && "scale-110")} />
                    <span className="truncate">
                        {status === "COMPLETED" ? "İzlendi" : "İzledim"}
                    </span>
                </button>

                {/* Recommend / Share Button */}
                <button
                    onClick={() => {
                        if (isRestrictedUser) {
                            showAuthWarning("Tavsiye etmek için kayıt olmalısın!");
                            return;
                        }
                        setIsRecommendOpen(true);
                    }}
                    className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-sm"
                    title="Arkadaşına Tavsiye Et"
                    aria-label="Tavsiye Et"
                >
                    <Share2 className="w-4 h-4 stroke-[2.5]" />
                </button>
            </div>

            {status === "COMPLETED" && (
                <div className="flex items-center px-1">
                    <button
                        onClick={() => setShowDetailsForm(!showDetailsForm)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-0.5"
                    >
                        {showDetailsForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{showDetailsForm ? "Puan & İnceleme Formunu Kapat" : "Puan & İnceleme Ekle / Düzenle"}</span>
                    </button>
                </div>
            )}

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
