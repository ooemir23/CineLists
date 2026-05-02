"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Check, MessageSquare, ThumbsUp, ThumbsDown, ChevronRight, Play, Star, Calendar, Clock, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useTransition, useEffect } from "react";
import { markEpisodeAsWatched, removeEpisodeWatch, rateEpisode, ensureEpisodeExists } from "@/lib/tv-actions";
import { addEpisodeComment } from "@/lib/comment-actions";
import { useRouter } from "next/navigation";

type Episode = {
    id: string;
    title?: string;
    name?: string;
    episode_number: number;
    season_number: number;
    overview?: string;
    still_path?: string;
    air_date?: string;
    runtime?: number;
    vote_average?: number;
    comments?: any[];
    ratings?: Array<{ rating: number; userId?: string }>;
};

type EpisodeItemProps = {
    tmdbId: number;
    seasonNumber: number;
    episode: Episode;
    isWatched: boolean;
    onRefresh?: () => void;
};

export default function EpisodeItem({
    tmdbId,
    seasonNumber,
    episode,
    isWatched: initialIsWatched,
    onRefresh
}: EpisodeItemProps) {
    const [isWatched, setIsWatched] = useState(initialIsWatched);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        setIsWatched(initialIsWatched);
    }, [initialIsWatched]);

    const [comments, setComments] = useState(episode.comments || []);
    const [internalEpisode, setInternalEpisode] = useState(episode);

    useEffect(() => {
        setComments(episode.comments || []);
        setInternalEpisode(episode);
    }, [episode]);

    const handleToggleWatch = async () => {
        const newState = !isWatched;
        setIsWatched(newState);

        startTransition(async () => {
            if (newState) {
                await markEpisodeAsWatched(
                    tmdbId,
                    seasonNumber,
                    episode.episode_number,
                    episode.name || episode.title || "",
                    episode.overview || "",
                    episode.still_path || "",
                    episode.air_date || ""
                );
            } else {
                await removeEpisodeWatch(tmdbId, seasonNumber, episode.episode_number);
            }
            onRefresh?.();
        });
    };

    const currentRating = internalEpisode.ratings?.[0]?.rating;
    const likeCount = (episode.ratings || []).filter(r => r.rating === 1).length;
    const episodeUrl = `/tv/${tmdbId}/s/${seasonNumber}/e/${episode.episode_number}`;

    return (
        <div
            className={cn(
                "group relative border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-all overflow-hidden",
                isWatched && "bg-emerald-500/[0.02]"
            )}
        >
            <div className="flex flex-col md:flex-row gap-4 p-4 sm:p-5">
                {/* LEFT: Image Section (Links to Episode Page) */}
                <Link 
                    href={episodeUrl}
                    className="relative shrink-0 w-full md:w-56 aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 group-hover:ring-amber-400/30 transition-all"
                >
                    {episode.still_path ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                            alt={episode.name || "Bölüm"}
                            fill
                            sizes="(max-width: 768px) 100vw, 224px"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[10px] font-black text-neutral-700 uppercase tracking-widest">Görsel Yok</div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={24} className="text-white fill-current transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                    </div>

                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-black text-white border border-white/10 uppercase tracking-tighter">
                        Bölüm {episode.episode_number}
                    </div>
                </Link>

                {/* RIGHT: Content & Social Actions */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <Link href={episodeUrl} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                            <h4 className={cn(
                                "font-black text-base sm:text-lg leading-tight tracking-tight truncate transition-colors",
                                isWatched ? "text-emerald-400" : "text-white group-hover:text-amber-400"
                            )}>
                                {episode.name}
                            </h4>
                            {episode.vote_average && episode.vote_average > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-400/10 rounded-lg border border-amber-400/20">
                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[10px] font-black text-amber-400">{episode.vote_average.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            {episode.air_date && (
                                <span className="flex items-center gap-1"><Calendar size={12} />{new Date(episode.air_date).getFullYear()}</span>
                            )}
                            {episode.runtime && (
                                <span className="flex items-center gap-1"><Clock size={12} />{episode.runtime} DK</span>
                            )}
                        </div>
                    </Link>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {episode.overview || "Özet bulunmuyor."}
                    </p>

                    {/* SOCIAL ACTION BAR - Prominent */}
                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2">
                            {/* Watched Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleToggleWatch();
                                }}
                                disabled={isPending}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                                    isWatched
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5"
                                )}
                            >
                                {isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isWatched ? (
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                )}
                                {isWatched ? "İZLEDİM" : "İZLEMEDİM"}
                            </button>

                            {/* Link to Episode Page for Comments */}
                            <Link
                                href={episodeUrl}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 group/social"
                            >
                                <MessageSquare className="w-3.5 h-3.5 group-hover/social:scale-110 transition-transform" />
                                <span>YORUMLAR</span>
                                {comments.length > 0 && (
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded-md text-amber-400">{comments.length}</span>
                                )}
                            </Link>

                            {/* Like Indicator */}
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                                <ThumbsUp 
                                    size={14} 
                                    className={cn(
                                        "transition-colors",
                                        currentRating === 1 ? "text-amber-400 fill-amber-400" : "text-neutral-500"
                                    )} 
                                />
                                {likeCount > 0 && (
                                    <span className="text-[10px] font-black text-neutral-400">{likeCount}</span>
                                )}
                            </div>
                        </div>

                        <Link 
                            href={episodeUrl}
                            className="p-2 text-neutral-600 hover:text-amber-400 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
