"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Send, Globe, X, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoScrollText } from "@/components/ui/auto-scroll-text";
import { RecommendModal } from "./recommend-modal";
import { useState, useEffect, useRef } from "react";
import { getFriendsRatings } from "@/lib/rating-actions";
import { createPortal } from "react-dom";

type MediaCardProps = {
    id: number;
    title: string;
    originalTitle?: string;
    posterPath: string | null;
    voteAverage: number;
    userRating?: number;
    communityRating?: { average: number; count: number };
    runtime?: number;
    releaseDate?: string;
    type: "movie" | "tv" | "person";
    fullWidth?: boolean;
    overview?: string;
    watchProviders?: {
        flatrate?: Array<{
            provider_id: number;
            provider_name: string;
            logo_path?: string | null;
        }>;
    } | null;
    friend?: {
        name: string | null;
        image: string | null;
        type: string;
    } | null;
    compact?: boolean;
    genres?: string[];
    statusLabel?: string;
    statusType?: "watching" | "plan_to_watch";
};

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const PREVIEW_WIDTH = 256;

const formatRuntime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
    }
    return `${mins}dk`;
};

const BodyPortal = ({ children }: { children: React.ReactNode }) => {
    if (typeof document === "undefined") return null;
    return createPortal(children, document.body);
};

export function MediaCard({
    id,
    title,
    originalTitle,
    posterPath,
    voteAverage,
    userRating,
    runtime,
    releaseDate,
    type,
    fullWidth = false,
    overview,
    watchProviders,
    friend,
    compact = false,
    genres,
    statusLabel,
    statusType
}: MediaCardProps) {
    type FriendRating = {
        userId: string;
        userName: string | null;
        userImage: string | null;
        rating: number | null;
    };

    const [isRecommendOpen, setIsRecommendOpen] = useState(false);
    const [isRatingsPopupOpen, setIsRatingsPopupOpen] = useState(false);
    const [friendsRatings, setFriendsRatings] = useState<FriendRating[]>([]);
    const [loadingRatings, setLoadingRatings] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
    const [previewPosition, setPreviewPosition] = useState<{
        top: number;
        left: number;
        placement: "left" | "right";
    } | null>(null);
    const cardRef = useRef<HTMLAnchorElement | null>(null);

    const updatePreviewPosition = () => {
        if (!cardRef.current || typeof window === "undefined") return;

        const rect = cardRef.current.getBoundingClientRect();
        const viewportPadding = 16;
        const sideGap = 18;
        const previewHeightEstimate = 188;
        const centeredTop = rect.top + rect.height / 2;
        const clampedTop = Math.min(
            Math.max(centeredTop, viewportPadding + previewHeightEstimate / 2),
            window.innerHeight - viewportPadding - previewHeightEstimate / 2
        );
        const spaceOnRight = window.innerWidth - rect.right;
        const showOnRight = spaceOnRight >= PREVIEW_WIDTH + sideGap + viewportPadding;
        const fallbackLeft = rect.left - sideGap;
        const fallbackRight = rect.right + sideGap;

        setPreviewPosition({
            top: clampedTop,
            left: showOnRight ? fallbackRight : fallbackLeft,
            placement: showOnRight ? "right" : "left",
        });
    };

    const handleMouseEnter = () => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
            const timer = setTimeout(() => {
                updatePreviewPosition();
                setShowPreview(true);
            }, 1000);
            setHoverTimer(timer);
        }
    };

    const handleMouseLeave = () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        setShowPreview(false);
    };

    const handleTouchStart = () => {
        // Mobile should navigate predictably; hover previews are reserved for pointer devices.
    };

    const handleTouchEnd = () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        setShowPreview(false);
    };

    useEffect(() => {
        if (!showPreview) return;

        const syncPosition = () => updatePreviewPosition();
        syncPosition();

        window.addEventListener("scroll", syncPosition, true);
        window.addEventListener("resize", syncPosition);

        return () => {
            window.removeEventListener("scroll", syncPosition, true);
            window.removeEventListener("resize", syncPosition);
        };
    }, [showPreview]);

    const handleFriendsRatingsClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsRatingsPopupOpen(true);
        if (friendsRatings.length === 0 && (type === "movie" || type === "tv")) {
            setLoadingRatings(true);
            try {
                const ratings = await getFriendsRatings(id, type);
                setFriendsRatings(ratings);
            } finally {
                setLoadingRatings(false);
            }
        }
    };

    if (!posterPath && type !== "person") return null;

    return (
        <>
            <Link
                ref={cardRef}
                href={`/${type}/${id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={cn(
                    "group relative isolate overflow-visible flex flex-col gap-1.5 md:gap-2 transition-all duration-500 ease-out flex-none z-0 hover:z-[140] md:hover:scale-110 snap-start",
                    fullWidth ? "w-full" : compact ? "w-[28vw] sm:w-28 md:w-32" : "w-[43vw] sm:w-36 md:w-44 lg:w-48"
                )}
            >
                {statusLabel && (
                    <div className={cn(
                        "absolute -top-2 left-1/2 -translate-x-1/2 z-[80] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-300",
                        statusType === "watching"
                            ? "bg-sky-500/90 text-white border-sky-400 shadow-sky-500/20"
                            : "bg-amber-500/90 text-slate-950 border-amber-400 shadow-amber-500/20"
                    )}>
                        {statusLabel}
                    </div>
                )}

                {type !== "person" && ((genres && genres.length > 0) || watchProviders?.flatrate) && (
                    <div className="flex items-end justify-between w-full px-2 mb-1 z-30 relative pointer-events-none overflow-visible">
                        <div className="flex -space-x-1.5 z-30">
                            {watchProviders?.flatrate?.slice(0, 3).map((provider) => (
                                <div key={provider.provider_id} className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden border-2 border-[#1e293b] shadow-md relative pointer-events-auto" title={provider.provider_name}>
                                    <img
                                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>

                        {genres && genres.length > 0 && (
                            <div className="flex bg-black/95 rounded-md border border-amber-400/50 overflow-hidden shadow-lg z-30 ml-auto pointer-events-auto">
                                {genres.map((genre, index) => (
                                    <span
                                        key={genre}
                                        className={cn(
                                            "px-1.5 py-0.5 md:px-2 md:py-1 text-[8px] md:text-[9px] font-black text-amber-400 uppercase tracking-wider",
                                            index > 0 && "border-l border-amber-400/30"
                                        )}
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className={cn(
                    "relative aspect-[2/3] rounded-[1.05rem] md:rounded-2xl bg-slate-800 shadow-xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-2xl",
                    statusType === "plan_to_watch"
                        ? "ring-2 ring-rose-500/50 shadow-rose-500/20"
                        : statusType === "watching"
                            ? "ring-2 ring-sky-500/50 shadow-sky-500/20"
                            : type === "movie"
                                ? "group-hover:ring-2 group-hover:ring-amber-500/50 group-hover:shadow-amber-500/20"
                                : type === "tv"
                                    ? "group-hover:ring-2 group-hover:ring-blue-500/50 group-hover:shadow-blue-500/20"
                                    : "group-hover:ring-2 group-hover:ring-primary/50",
                    type === "person" && "aspect-square rounded-full border-4 border-white/5 group-hover:border-primary/50"
                )}>
                    {friend && (
                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 max-w-[calc(100%-12px)]">
                            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full overflow-hidden border border-amber-400/50 shrink-0">
                                <img
                                    src={friend.image || `https://ui-avatars.com/api/?name=${friend.name || "U"}&background=fbbf24&color=000`}
                                    alt={friend.name || "User"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-white truncate uppercase tracking-tighter">
                                {friend.name?.split(" ")[0]} {friend.type === "WATCHED" ? "izledi" : friend.type === "RATED" ? "puanladı" : "ekledi"}
                            </span>
                        </div>
                    )}

                    <div className="absolute inset-0 rounded-[1.05rem] md:rounded-2xl overflow-hidden z-0">
                        {posterPath ? (
                            <Image
                                src={`${IMAGE_BASE_URL}${posterPath}`}
                                alt={title}
                                fill
                                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                                sizes="(max-width: 768px) 45vw, (max-width: 1200px) 33vw, 20vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <span className="text-4xl">👤</span>
                            </div>
                        )}

                        {type !== "person" && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 z-10">
                                <div className="absolute top-3 left-3">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsRecommendOpen(true);
                                        }}
                                        className="w-7 h-7 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary active:scale-90 touch-target-sm"
                                        title="Tavsiye Et"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={cn(
                    "flex flex-col gap-0.5 md:gap-1 px-0.5 md:px-1",
                    type === "person" && "items-center text-center"
                )}>
                    {type !== "person" && (
                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={cn(
                                    "font-black uppercase tracking-[0.1em]",
                                    compact ? "text-[7px]" : "text-[7px] min-[390px]:text-[8px] md:text-[9px]",
                                    type === "movie" ? "text-amber-500" : "text-blue-500"
                                )}>
                                    {type === "movie" ? "Film" : "Dizi"}
                                </span>
                                {(releaseDate || runtime) && (
                                    <>
                                        <span className="text-neutral-600 font-black text-[8px]">•</span>
                                        <span className={cn(
                                            "font-bold text-neutral-500 flex items-center gap-1 uppercase tracking-wider",
                                            compact ? "text-[7px]" : "text-[7px] min-[390px]:text-[8px] md:text-[9px]"
                                        )}>
                                            {releaseDate && new Date(releaseDate).getFullYear()}
                                            {releaseDate && runtime && <span className="text-neutral-600 font-black text-[8px] mx-0.5">•</span>}
                                            {runtime && formatRuntime(runtime)}
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className={cn("flex items-center flex-1 justify-end min-w-0", compact ? "gap-0.5" : "gap-1 md:gap-2")}>
                                <div className="flex items-center gap-0.5 bg-white/5 px-1 py-0.5 rounded-md border border-white/5 shrink-0" title="Dünya Geneli Puanı (TMDB)">
                                    <Globe className="w-2 md:w-2.5 h-2 md:h-2.5 text-blue-400" />
                                    <span className="text-[8px] min-[390px]:text-[9px] md:text-[10px] font-black text-white">{voteAverage?.toFixed(1) || "0"}</span>
                                </div>

                                <button
                                    onClick={handleFriendsRatingsClick}
                                    className={cn(
                                        "flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 rounded-md border transition-all shrink-0 hover:scale-110 active:scale-95 touch-target-sm",
                                        userRating !== null && userRating !== undefined
                                            ? "bg-primary/20 border-primary/30 text-primary"
                                            : "bg-white/5 border-white/5 text-neutral-500"
                                    )}
                                    title="Senin puanın ve arkadaş puanları"
                                >
                                    <Star className={cn("w-2 md:w-2.5 h-2 md:h-2.5", userRating !== null && userRating !== undefined ? "fill-current" : "text-neutral-500")} />
                                    <span className="text-[8px] min-[390px]:text-[9px] md:text-[10px] font-black">
                                        {userRating !== null && userRating !== undefined ? userRating.toFixed(1) : "-"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={cn(
                        "font-black text-white transition-colors tracking-tight group-hover:text-primary leading-tight",
                        type === "person" ? "text-[9px] md:text-xs" : compact ? "text-[10px] md:text-xs" : "text-[11px] min-[390px]:text-xs md:text-base"
                    )}>
                        <AutoScrollText text={title} />
                    </div>
                    {originalTitle && originalTitle !== title && type !== "person" && (
                        <p className="text-[8px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-tight truncate opacity-80 mt-[-2px]">
                            {originalTitle}
                        </p>
                    )}
                    {type === "person" && (
                        <span className="text-xs text-primary/80 font-bold uppercase tracking-widest mt-0.5">Sanatçı</span>
                    )}
                </div>
            </Link>

            {showPreview && overview && previewPosition && (
                <BodyPortal>
                    <div
                        className="fixed z-[1200] pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
                        style={{
                            top: previewPosition.top,
                            left: previewPosition.left,
                            width: PREVIEW_WIDTH,
                            transform: previewPosition.placement === "right"
                                ? "translate(0, -50%)"
                                : "translate(-100%, -50%)",
                        }}
                    >
                        <div className="relative w-full p-4 bg-[#1b2334] border border-white/10 rounded-2xl shadow-2xl">
                            <div
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1b2334] border-white/10 rotate-45",
                                    previewPosition.placement === "right"
                                        ? "left-[-8px] border-l border-b"
                                        : "right-[-8px] border-r border-t"
                                )}
                            />

                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest shrink-0">Özet</h4>
                                    {runtime && (
                                        <span className="text-[10px] font-bold text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5 flex items-center gap-1 shrink-0">
                                            <Clock size={10} />
                                            {formatRuntime(runtime)}
                                        </span>
                                    )}
                                </div>
                                {watchProviders?.flatrate && (
                                    <div className="flex gap-1 shrink-0">
                                        {watchProviders.flatrate.slice(0, 3).map((provider) => (
                                            <div key={provider.provider_id} className="w-5 h-5 rounded-md overflow-hidden border border-white/10 shadow-lg">
                                                <img
                                                    src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                    alt={provider.provider_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-white font-medium leading-relaxed line-clamp-6 italic">
                                &quot;{overview}&quot;
                            </p>
                        </div>
                    </div>
                </BodyPortal>
            )}

            {isRecommendOpen && (
                <RecommendModal
                    mediaId={id}
                    title={title}
                    type={type === "person" ? "movie" : type}
                    posterPath={posterPath}
                    onClose={() => setIsRecommendOpen(false)}
                />
            )}

            {isRatingsPopupOpen && (
                <BodyPortal>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setIsRatingsPopupOpen(false)}
                        />
                        <div className="relative w-full max-w-sm bg-[#1A202C] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                                        <Star className="w-5 h-5 text-primary fill-current" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Arkadaş Puanları</h3>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsRatingsPopupOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>

                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {loadingRatings ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Yükleniyor...</p>
                                    </div>
                                ) : friendsRatings.length > 0 ? (
                                    <div className="space-y-3">
                                        {friendsRatings.map((ratingEntry) => (
                                            <Link
                                                key={ratingEntry.userId}
                                                href={`/profile/${ratingEntry.userId}`}
                                                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                                                onClick={() => setIsRatingsPopupOpen(false)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 border border-white/10 group-hover:border-primary/50 transition-colors">
                                                        {ratingEntry.userImage ? (
                                                            <Image src={ratingEntry.userImage} alt={ratingEntry.userName || "Kullanıcı"} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white group-hover:text-primary transition-colors truncate max-w-[150px]">
                                                            {ratingEntry.userName || "Arkadaş"}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-500 font-bold">Arkadaş</p>
                                                    </div>
                                                </div>
                                                <div className="bg-primary px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20">
                                                    <Star className="w-3.5 h-3.5 text-white fill-current" />
                                                    <span className="text-sm font-black text-white">{ratingEntry.rating?.toFixed(1) || "0.0"}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                            <Star className="w-8 h-8 text-neutral-700" />
                                        </div>
                                        <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Arkadaşlarından henüz puan yok</p>
                                    </div>
                                )}
                            </div>

                            {friendsRatings.length > 0 && (
                                <div className="p-4 bg-white/5 border-t border-white/5">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">
                                        <span>Puan Veren Arkadaş</span>
                                        <span className="text-primary">{friendsRatings.length}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </BodyPortal>
            )}
        </>
    );
}
