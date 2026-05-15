"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

interface MediaCarouselItem {
    id: number;
    title?: string;
    name?: string;
    posterPath?: string | null;
    poster_path?: string | null;
    voteAverage?: number;
    vote_average?: number;
    mediaType?: "movie" | "tv";
    media_type?: "movie" | "tv";
}

interface MediaCarouselProps {
    items: MediaCarouselItem[];
    title: string;
    icon?: React.ReactNode;
    color?: string;
}

export function MediaCarousel({ items, title, icon, color = "text-primary" }: MediaCarouselProps) {
    const getMediaType = (item: MediaCarouselItem) => {
        return (item.mediaType || item.media_type || "movie") as "movie" | "tv";
    };

    const getTitle = (item: MediaCarouselItem) => {
        return item.title || item.name || "Tarih Bekleniyor";
    };

    const getPosterPath = (item: MediaCarouselItem) => {
        return item.posterPath || item.poster_path;
    };

    const getVote = (item: MediaCarouselItem) => {
        return (item.voteAverage || item.vote_average) || 0;
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 px-1">
                {icon && <div className={color}>{icon}</div>}
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>

            {/* Carousel */}
            <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-3">
                    {items.map((item) => (
                        <Link
                            key={`${item.id}`}
                            href={`/${getMediaType(item)}/${item.id}`}
                            className="group flex-shrink-0 w-32 md:w-40 overflow-hidden"
                        >
                            {/* Poster */}
                            {getPosterPath(item) ? (
                                <div className="relative w-full aspect-[2/3] bg-neutral-900 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 hover:ring-white/30 transition-all">
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w342${getPosterPath(item)}`}
                                        alt={getTitle(item)}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Hover Info */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <h4 className="text-xs md:text-sm font-bold text-white line-clamp-2">
                                            {getTitle(item)}
                                        </h4>
                                        {getVote(item) > 0 && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                                <span className="text-xs text-amber-400 font-bold">
                                                    {getVote(item).toFixed(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full aspect-[2/3] bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl flex items-center justify-center">
                                    <Star size={24} className="text-neutral-600" />
                                </div>
                            )}

                            {/* Title below */}
                            <p className="text-xs font-bold text-white mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {getTitle(item)}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
