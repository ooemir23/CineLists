"use client";

import Image from "next/image";
import { Eye, Check, MessageSquare, ThumbsUp, ThumbsDown, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useTransition, useEffect } from "react";
import { markEpisodeAsWatched, removeEpisodeWatch, rateEpisode, ensureEpisodeExists } from "@/lib/tv-actions";
import { addEpisodeComment } from "@/lib/comment-actions";
import { EpisodeDetailsModal } from "./episode-details-modal";
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsWatched(initialIsWatched);
    }, [initialIsWatched]);

    // Internal state for comments and ratings to keep UI snappy
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

    const handleRate = async (rating: number) => {
        // Optimistic update for the modal UI
        const currentRating = internalEpisode.ratings?.[0]?.rating;
        const newRating = currentRating === rating ? null : rating;

        setInternalEpisode({
            ...internalEpisode,
            ratings: newRating === null ? [] : [{ rating: newRating, userId: "current" }]
        });

        startTransition(async () => {
            await rateEpisode({
                tmdbId,
                seasonNumber,
                episodeNumber: episode.episode_number,
                rating,
                title: episode.name || "",
                overview: episode.overview || "",
                stillPath: episode.still_path || "",
                airDate: episode.air_date || ""
            });
            onRefresh?.();
            router.refresh();
        });
    };

    const handleAddComment = async (text: string, isSpoiler: boolean = false) => {
        if (!text.trim()) return;

        startTransition(async () => {
            const dbEp = await ensureEpisodeExists({
                tmdbId,
                seasonNumber,
                episodeNumber: episode.episode_number,
                title: episode.name || "",
                overview: episode.overview || "",
                stillPath: episode.still_path || "",
                airDate: episode.air_date || ""
            });

            const result = await addEpisodeComment(dbEp.id, text, `/tv/${tmdbId}`, isSpoiler);
            if (result.success) {
                const newComment = {
                    id: Math.random().toString(),
                    content: text,
                    isSpoiler,
                    createdAt: new Date(),
                    user: { name: "Siz", image: null }
                };
                setComments((prev: any[]) => [newComment, ...prev]);
                onRefresh?.();
            } else if (result.error) {
                alert(result.error);
            }
        });
    };

    const currentRating = internalEpisode.ratings?.[0]?.rating;

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all cursor-pointer relative"
            >
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 p-2.5 md:p-6">
                    {/* Image Section */}
                    <div className="shrink-0 w-full md:w-48 aspect-video bg-neutral-800 rounded-xl relative overflow-hidden ring-1 ring-white/5">
                        {episode.still_path ? (
                            <Image
                                src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                alt={episode.name || "Episode"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-600 uppercase tracking-widest">Görsel Yok</div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-90 group-hover:scale-100 transition-transform">
                                <Play size={20} className="text-white fill-current ml-1" />
                            </div>
                        </div>

                        {isWatched && (
                            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg ring-2 ring-black/20">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}

                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 md:px-2 md:py-1 bg-black/60 backdrop-blur-md rounded-lg text-[7px] md:text-[9px] font-black text-white border border-white/10 uppercase tracking-tighter">
                            Bölüm {episode.episode_number}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className={cn(
                                    "font-black text-[12px] md:text-lg leading-tight tracking-tight transition-colors line-clamp-1",
                                    isWatched ? "text-green-400" : "text-white group-hover:text-amber-400"
                                )}>
                                    {episode.name}
                                </h4>
                                <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">
                                    <span>{episode.air_date?.split("-")[0]}</span>
                                    {episode.runtime && (
                                        <>
                                            <span className="w-1 h-1 bg-neutral-700 rounded-full" />
                                            <span>{episode.runtime} Dakika</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Stats preview */}
                                <div className="hidden sm:flex items-center gap-3 mr-2">
                                    {currentRating !== undefined && (
                                        <div className={cn(
                                            "flex items-center gap-1 text-[10px] font-black uppercase",
                                            currentRating === 1 ? "text-amber-400" : "text-rose-500"
                                        )}>
                                            {currentRating === 1 ? <ThumbsUp size={12} fill="currentColor" /> : <ThumbsDown size={12} fill="currentColor" />}
                                            {currentRating === 1 ? "BEĞENİLDİ" : "BEĞENİLMEDİ"}
                                        </div>
                                    )}
                                    {comments.length > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-neutral-500 uppercase">
                                            <MessageSquare size={12} />
                                            {comments.length}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleWatch();
                                    }}
                                    disabled={isPending}
                                    className={cn(
                                        "p-2 md:p-2.5 rounded-xl transition-all active:scale-90",
                                        isWatched
                                            ? "text-green-500 bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/10"
                                            : "text-neutral-500 bg-white/5 border border-white/5 hover:border-white/10 hover:text-white"
                                    )}
                                >
                                    <Eye className={cn("w-4 h-4 md:w-5 md:h-5", isWatched && "fill-current")} />
                                </button>

                                <div className="hidden md:block p-2 text-neutral-600 group-hover:text-amber-400 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>

                        <p className="hidden md:line-clamp-2 text-sm text-neutral-500 mt-2 leading-relaxed font-medium group-hover:text-neutral-400 transition-colors">
                            {episode.overview || "Bu bölüm için henüz bir özet girilmemiş. Detaylar için tıklayın."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Episode Details Modal */}
            <EpisodeDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                episode={internalEpisode}
                isWatched={isWatched}
                onToggleWatch={handleToggleWatch}
                onRate={handleRate}
                onAddComment={handleAddComment}
                comments={comments}
                isPending={isPending}
            />
        </>
    );
}
