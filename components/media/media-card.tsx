"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

type MediaCardProps = {
    id: number;
    title: string;
    originalTitle?: string;
    posterPath: string | null;
    voteAverage: number;
    userRating?: number;
    runtime?: number;
    releaseDate?: string;
    type: "movie" | "tv";
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

export function MediaCard({ id, title, originalTitle, posterPath, voteAverage, userRating, runtime, releaseDate, type }: MediaCardProps) {
    if (!posterPath) return null;

    return (
        <Link href={`/${type}/${id}`} className="group relative flex flex-col gap-2 w-36 md:w-44 flex-none snap-start">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:ring-2 group-hover:ring-primary/50">
                <Image
                    src={`${IMAGE_BASE_URL}${posterPath}`}
                    alt={title}
                    fill
                    className="object-cover transition-all duration-300 group-hover:brightness-110"
                    sizes="(max-width: 768px) 144px, 176px"
                />

                {/* Overlay Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-white font-bold text-xs bg-primary px-2 py-1 rounded-full shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Detaylar
                    </span>
                </div>

                {/* Rating Overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {voteAverage !== undefined && voteAverage > 0 && (
                        <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-yellow-500 border border-white/10 group-hover:bg-black/80 transition-colors">
                            <Star className="w-3 h-3 fill-current" />
                            {voteAverage.toFixed(1)}
                        </div>
                    )}
                    {userRating && (
                        <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-primary border border-white/10 group-hover:bg-black/80 transition-colors">
                            <Star className="w-3 h-3 fill-current" />
                            {userRating}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-0.5 pl-1 overflow-hidden">
                <h3 className="font-medium text-sm text-neutral-200 truncate group-hover:text-primary transition-colors">
                    {title}
                </h3>
                {originalTitle && originalTitle !== title && (
                    <span className="text-[10px] text-neutral-500 truncate italic">
                        ({originalTitle})
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1 pl-1 text-[10px] text-neutral-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {releaseDate && (
                        <span>{new Date(releaseDate).getFullYear()}</span>
                    )}
                    {(voteAverage > 0 || runtime) && (
                        <div className="flex items-center gap-1 text-yellow-500/80 font-medium">
                            {voteAverage > 0 && (
                                <>
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    {voteAverage.toFixed(1)}
                                </>
                            )}
                            {runtime && (
                                <span className="ml-1 text-neutral-400">• {formatRuntime(runtime)}</span>
                            )}
                        </div>
                    )}
                    {userRating && (
                        <div className="flex items-center gap-0.5 text-primary font-medium">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {userRating}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );

}
