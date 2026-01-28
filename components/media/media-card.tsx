"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Send, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecommendModal } from "./recommend-modal";
import { ExpandableImage } from "@/components/ui/expandable-image";
import { useState } from "react";

type MediaCardProps = {
    id: number;
    title: string;
    originalTitle?: string;
    posterPath: string | null;
    voteAverage: number;
    userRating?: number;
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

export function MediaCard({ id, title, originalTitle, posterPath, voteAverage, userRating, runtime, releaseDate, type, fullWidth = false }: MediaCardProps) {
    const [isRecommendOpen, setIsRecommendOpen] = useState(false);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    if (!posterPath && type !== "person") return null;

    return (
        <Link
            href={`/${type}/${id}`}
            className={cn(
                "group relative flex flex-col gap-3 transition-all duration-300 flex-none",
                fullWidth ? "w-full" : "w-36 md:w-44 lg:w-48"
            )}
        >
            <div className={cn(
                "relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-800 shadow-xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:ring-1 group-hover:ring-primary/50",
                type === "person" && "aspect-square rounded-full border-4 border-white/5 group-hover:border-primary/50"
            )}>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                        <span className="text-white font-black text-xs bg-primary px-4 py-2 rounded-full shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500 uppercase tracking-wider">
                            İncele
                        </span>

                        {/* Recommend Button */}
                        <div className="absolute top-3 left-3 flex gap-2">
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
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsZoomOpen(true);
                                }}
                                className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-500 hover:border-amber-500 active:scale-90"
                                title="Büyüt"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Rating Overlay */}
                {type !== "person" && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {voteAverage !== undefined && voteAverage > 0 && (
                            <div className="bg-black/80 backdrop-blur-xl px-2 py-1 rounded-xl flex items-center gap-1.5 text-xs font-black text-yellow-500 border border-white/10 group-hover:scale-110 transition-transform">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {voteAverage.toFixed(1)}
                            </div>
                        )}
                        {userRating && (
                            <div className="bg-primary/90 backdrop-blur-xl px-2 py-1 rounded-xl flex items-center gap-1.5 text-xs font-black text-white border border-white/20 group-hover:scale-110 transition-transform">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {userRating}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={cn(
                "flex flex-col gap-1 px-1",
                type === "person" && "items-center text-center"
            )}>
                <h3 className="font-black text-base text-white truncate group-hover:text-primary transition-colors tracking-tight">
                    {title}
                </h3>
                {type === "person" ? (
                    <span className="text-xs text-primary/80 font-bold uppercase tracking-widest">Sanatçı</span>
                ) : (
                    <>
                        {originalTitle && originalTitle !== title && (
                            <span className="text-[11px] text-neutral-500 truncate italic font-medium">
                                {originalTitle}
                            </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            {releaseDate && (
                                <span className="text-xs font-bold text-neutral-400">
                                    {new Date(releaseDate).getFullYear()}
                                </span>
                            )}
                            {runtime && (
                                <span className="text-xs font-medium text-neutral-500">
                                    • {formatRuntime(runtime)}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
            {isRecommendOpen && (
                <RecommendModal
                    mediaId={id}
                    title={title}
                    type={type === "person" ? "movie" : type}
                    posterPath={posterPath}
                    onClose={() => setIsRecommendOpen(false)}
                />
            )}

            {/* Custom Lightbox Modal for MediaCard */}
            {isZoomOpen && posterPath && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsZoomOpen(false);
                    }}
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-4 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                        <div className="relative aspect-[2/3] h-[70vh] md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            <Image
                                src={`https://image.tmdb.org/t/p/original${posterPath}`}
                                alt={title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full">
                            <p className="text-white font-black tracking-tight text-lg italic uppercase">{title}</p>
                        </div>
                    </div>
                </div>
            )}
        </Link>
    );
}
