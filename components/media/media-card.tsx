"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Send, Globe, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoScrollText } from "@/components/ui/auto-scroll-text";
import { RecommendModal } from "./recommend-modal";
import { useState, useEffect } from "react";
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
};

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const formatRuntime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
    }
    return `${mins}dk`;
};

// Portal for the popup
const RatingPortal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    if (!mounted) return null;
    return createPortal(children, document.body);
};

export function MediaCard({
    id,
    title,
    originalTitle,
    posterPath,
    voteAverage,
    userRating,
    communityRating,
    runtime,
    releaseDate,
    type,
    fullWidth = false
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
                href={`/${type}/${id}`}
                className={cn(
                    "group relative flex flex-col gap-2 md:gap-3 transition-all duration-500 ease-out flex-none hover:z-40 md:hover:scale-110 snap-start",
                    fullWidth ? "w-full" : "w-32 sm:w-36 md:w-44 lg:w-48"
                )}
            >
                <div className={cn(
                    "relative aspect-[2/3] rounded-2xl bg-slate-800 shadow-xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-2xl",
                    type === "movie"
                        ? "group-hover:ring-2 group-hover:ring-amber-500/50 group-hover:shadow-amber-500/20"
                        : type === "tv"
                            ? "group-hover:ring-2 group-hover:ring-blue-500/50 group-hover:shadow-blue-500/20"
                            : "group-hover:ring-2 group-hover:ring-primary/50",
                    type === "person" && "aspect-square rounded-full border-4 border-white/5 group-hover:border-primary/50"
                )}>
                    {/* Visual Content Wrapper with overflow-hidden */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden z-0">
                        {posterPath ? (
                            <Image
                                src={`${IMAGE_BASE_URL}${posterPath}`}
                                alt={title}
                                fill
                                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <span className="text-4xl">👤</span>
                            </div>
                        )}

                        {/* Overlay Gradient on Hover */}
                        {type !== "person" && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 z-10">
                                {/* Recommend Button */}
                                <div className="absolute top-3 left-3">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsRecommendOpen(true);
                                        }}
                                        className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary active:scale-90"
                                        title="Tavsiye Et"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={cn(
                    "flex flex-col gap-1 px-1",
                    type === "person" && "items-center text-center"
                )}>
                    {/* Label and Ratings Row */}
                    {type !== "person" && (
                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em] shrink-0",
                                type === "movie" ? "text-amber-500" : "text-blue-500"
                            )}>
                                {type === "movie" ? "Film" : "Dizi"}
                            </span>

                            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                {/* TMDB Global Rating */}
                                <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5 shrink-0" title="Dünya Geneli Puanı (TMDB)">
                                    <Globe className="w-2.5 h-2.5 text-blue-400" />
                                    <span className="text-[10px] font-black text-white">{voteAverage?.toFixed(1) || "0"}</span>
                                </div>

                                {/* User Rating + Friends Ratings */}
                                <button
                                    onClick={handleFriendsRatingsClick}
                                    className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all shrink-0 hover:scale-110 active:scale-95",
                                        userRating !== null && userRating !== undefined
                                            ? "bg-primary/20 border-primary/30 text-primary"
                                            : "bg-white/5 border-white/5 text-neutral-500"
                                    )}
                                    title="Senin puanın ve arkadaş puanları"
                                >
                                    <Star className={cn("w-2.5 h-2.5", userRating !== null && userRating !== undefined ? "fill-current" : "text-neutral-500")} />
                                    <span className="text-[10px] font-black">
                                        {userRating !== null && userRating !== undefined ? userRating.toFixed(1) : "-"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={cn(
                        "font-black text-white transition-colors tracking-tight group-hover:text-primary",
                        type === "person" ? "text-[10px] md:text-xs" : "text-base"
                    )}>
                        <AutoScrollText text={title} />
                    </div>
                    {type === "person" ? (
                        <span className="text-xs text-primary/80 font-bold uppercase tracking-widest">Sanatçı</span>
                    ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                            {releaseDate && (
                                <span className="text-[11px] font-bold text-neutral-500">
                                    {new Date(releaseDate).getFullYear()}
                                </span>
                            )}
                            {runtime && (
                                <span className="text-[11px] font-medium text-neutral-500">
                                    • {formatRuntime(runtime)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>

            {/* Recommend Modal */}
            {isRecommendOpen && (
                <RecommendModal
                    mediaId={id}
                    title={title}
                    type={type === "person" ? "movie" : type}
                    posterPath={posterPath}
                    onClose={() => setIsRecommendOpen(false)}
                />
            )}

            {/* Ratings View Popup */}
            {isRatingsPopupOpen && (
                <RatingPortal>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setIsRatingsPopupOpen(false)}
                        />
                        <div className="relative w-full max-w-sm bg-[#1A202C] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
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

                            {/* Ratings List */}
                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {loadingRatings ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Yükleniyor...</p>
                                    </div>
                                ) : friendsRatings.length > 0 ? (
                                    <div className="space-y-3">
                                        {friendsRatings.map((r) => (
                                            <Link
                                                key={r.userId}
                                                href={`/profile/${r.userId}`}
                                                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                                                onClick={() => setIsRatingsPopupOpen(false)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 border border-white/10 group-hover:border-primary/50 transition-colors">
                                                        {r.userImage ? (
                                                            <Image src={r.userImage} alt={r.userName || "Kullanıcı"} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white group-hover:text-primary transition-colors truncate max-w-[150px]">
                                                            {r.userName || "Arkadaş"}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-500 font-bold">Arkadaş</p>
                                                    </div>
                                                </div>
                                                <div className="bg-primary px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20">
                                                    <Star className="w-3.5 h-3.5 text-white fill-current" />
                                                    <span className="text-sm font-black text-white">{r.rating?.toFixed(1) || "0.0"}</span>
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

                            {/* Footer Information */}
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
                </RatingPortal>
            )}
        </>
    );
}
