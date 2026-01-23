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

                {voteAverage !== undefined && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-yellow-500 border border-white/10 group-hover:bg-black/80 transition-colors">
                        <Star className="w-3 h-3 fill-current" />
                        {voteAverage.toFixed(1)}
                    </div>
                )}
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
                    {voteAverage > 0 && (
                        <div className="flex items-center gap-0.5 text-yellow-500/80 font-medium">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {voteAverage.toFixed(1)}
                        </div>
                    )}
                    {userRating && (
                        <div className="flex items-center gap-0.5 text-primary font-medium">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {userRating}
                        </div>
                    )}
                    {runtime && (
                        <span>{runtime} dk</span>
                    )}
                </div>
            </div>
        </Link>
    );

}
