"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Heart,
    MessageSquare,
    Star,
    Film,
    Tv,
    Clock,
    User,
    Sparkles,
    Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type CompactActivityCardProps = {
    activity: {
        id: string;
        type: "WATCHED" | "RATED" | "REVIEWED" | "ADDED_TO_LIST";
        createdAt: Date;
        rating: number | null;
        review: string | null;
        watchedWith: string | null;
        recommendedByText: string | null;
        recommendedBy?: {
            id: string;
            name: string | null;
        } | null;
        platform?: string | null;
        user: {
            id: string;
            name: string | null;
            image: string | null;
        };
        media: {
            tmdbId: number;
            title: string;
            posterPath: string | null;
            backdropPath: string | null;
            type: "MOVIE" | "TV" | "PERSON";
            runtime?: number | null;
        };
        episode?: {
            id: string;
            seasonNumber: number;
            episodeNumber: number;
            title: string;
        } | null;
        episodeRange?: {
            seasonNumber: number;
            fromEpisode: number;
            toEpisode: number;
            count: number;
        } | null;
        _count: {
            comments: number;
        };
    };
};

export function CompactActivityCard({ activity }: CompactActivityCardProps) {
    const actionText = {
        WATCHED: "izledi",
        RATED: "puanladı",
        REVIEWED: "inceledi",
        ADDED_TO_LIST: "ekledi",
    }[activity.type];

    return (
        <Link href={`/profile/${activity.user.id}`}>
            <div className="bg-gradient-to-br from-white/8 to-white/3 hover:from-white/12 hover:to-white/5 border border-white/8 hover:border-white/15 rounded-xl p-3.5 transition-all duration-300 group cursor-pointer backdrop-blur-sm">
                <div className="flex gap-3">
                    {/* Poster Image - Larger */}
                    <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-neutral-900/50 shadow-lg ring-1 ring-white/10 group-hover:ring-primary/30 transition-all">
                        {activity.media.posterPath ? (
                            <Image
                                src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                                alt={activity.media.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                        )}
                        {/* Rating Badge */}
                        {activity.rating && (
                            <div className="absolute bottom-1.5 right-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                {activity.rating}
                            </div>
                        )}
                    </div>

                    {/* Content - Improved Layout */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        {/* User Info - More Prominent */}
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-primary/50 transition-all flex-shrink-0">
                                {activity.user.image ? (
                                    <Image src={activity.user.image} alt={activity.user.name || ""} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                                    {activity.user.name || "Kullanıcı"}
                                </p>
                                <p className="text-xs text-neutral-400 truncate">{actionText}</p>
                            </div>
                        </div>

                        {/* Media Title */}
                        <div className="mb-2">
                            <h4 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-1">
                                {activity.media.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-neutral-400 font-medium inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                                    {activity.media.type === "MOVIE" ? (
                                        <>
                                            <Film className="w-3 h-3" /> Film
                                        </>
                                    ) : (
                                        <>
                                            <Tv className="w-3 h-3" /> Dizi
                                        </>
                                    )}
                                </span>
                                {(activity.episode || activity.episodeRange) && (
                                    <span className="text-[11px] text-blue-400/90 font-medium bg-blue-500/15 px-2 py-0.5 rounded-md">
                                        {activity.episodeRange
                                            ? `${activity.episodeRange.count} Bölüm`
                                            : `S${activity.episode?.seasonNumber} B${activity.episode?.episodeNumber}`
                                        }
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Time & Stats */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                            </span>
                            <div className="flex items-center gap-3 text-neutral-400">
                                {activity.review && (
                                    <div className="flex items-center gap-1 hover:text-white transition-colors">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span className="text-[10px]">{activity._count.comments}</span>
                                    </div>
                                )}
                                <Heart className="w-3.5 h-3.5 hover:text-red-400 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
