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
        <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 transition-all duration-300 group">
            <div className="flex gap-3">
                {/* Mini Poster */}
                <div className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-900 shadow-md">
                    {activity.media.posterPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                            alt={activity.media.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                    )}
                    {/* Tiny Rating Badge */}
                    {activity.rating && (
                        <div className="absolute bottom-1 right-1 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                            <Star className="w-2 h-2 fill-current" />
                            {activity.rating}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        {/* User & Action */}
                        <div className="flex items-center gap-2 mb-1">
                            <Link href={`/profile/${activity.user.id}`} className="flex items-center gap-1.5 group/user">
                                <div className="relative w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/10 group-hover/user:ring-primary/50 transition-all">
                                    {activity.user.image ? (
                                        <Image src={activity.user.image} alt={activity.user.name || ""} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center"><User className="w-3 h-3 text-neutral-500" /></div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-white group-hover/user:text-primary transition-colors truncate max-w-[80px]">
                                    {activity.user.name}
                                </span>
                            </Link>
                            <span className="text-[10px] text-neutral-500">•</span>
                            <span className="text-[10px] text-neutral-400 font-medium truncate">{actionText}</span>
                            <span className="text-[10px] text-neutral-600 ml-auto whitespace-nowrap">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                            </span>
                        </div>

                        {/* Title */}
                        <Link href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`} className="block">
                            <h4 className="text-sm font-bold text-white leading-tight truncate group-hover:text-primary transition-colors">
                                {activity.media.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                {activity.media.type === "MOVIE" ? (
                                    <span className="text-[10px] text-neutral-500 font-medium inline-flex items-center gap-0.5">
                                        <Film className="w-2.5 h-2.5" /> Film
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-neutral-500 font-medium inline-flex items-center gap-0.5">
                                        <Tv className="w-2.5 h-2.5" /> Dizi
                                    </span>
                                )}
                                {(activity.episode || activity.episodeRange) && (
                                    <span className="text-[10px] text-blue-400/80 font-medium truncate">
                                        {activity.episodeRange
                                            ? `${activity.episodeRange.count} Bölüm`
                                            : `S${activity.episode?.seasonNumber} B${activity.episode?.episodeNumber}`
                                        }
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Footer Infos (Review/Social) */}
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {(activity.recommendedBy || activity.recommendedByText) && (
                                <div className="flex items-center gap-1 text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10" title="Tavsiye eden">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[60px]">{activity.recommendedBy?.name || activity.recommendedByText}</span>
                                </div>
                            )}
                            {activity.watchedWith && (
                                <div className="flex items-center gap-1 text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10" title="Birlikte izlenen">
                                    <Users className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </div>

                        {/* Mini Interactions */}
                        <div className="flex items-center gap-2 text-neutral-500">
                            {activity.review && <MessageSquare className="w-3 h-3 text-white/40" />}
                            <div className="flex items-center gap-0.5">
                                <Heart className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
