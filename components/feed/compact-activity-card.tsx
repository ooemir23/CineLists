"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Heart,
    MessageSquare,
    Star,
    User,
    Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addActivityComment, getActivityComments } from "@/lib/comment-actions";
import { voteActivity } from "@/lib/activity-actions";

type CompactActivityCardProps = {
    activity: {
        id: string;
        type: "WATCHED" | "RATED" | "REVIEWED" | "COMMENTED" | "LISTED";
        createdAt: Date;
        rating: number | null;
        review: string | null;
        votes: number;
        content?: string | null;
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
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(activity.votes || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<{ id: string; user: { name: string | null }; content: string }[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const lastTap = useRef<number>(0);

    const timeLabel = useMemo(
        () => formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr }),
        [activity.createdAt]
    );

    const fetchComments = async () => {
        setLoadingComments(true);
        const data = await getActivityComments(activity.id);
        setComments(data);
        setLoadingComments(false);
    };

    const handleLike = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        
        await voteActivity(activity.id, newIsLiked ? 1 : -1);
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (!isLiked) {
                handleLike();
            }
            setShowHeartAnim(true);
            setTimeout(() => setShowHeartAnim(false), 800);
        }
        lastTap.current = now;
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!commentInput.trim() || submitting) return;

        setSubmitting(true);
        const res = await addActivityComment(activity.id, commentInput);
        setSubmitting(false);

        if (res.success) {
            setCommentInput("");
            if (!showComments) setShowComments(true);
            fetchComments();
        }
    };

    const actionText = {
        WATCHED: "izledi",
        RATED: "puanladı",
        REVIEWED: "inceledi",
        COMMENTED: "yorum yaptı",
        LISTED: "listesine ekledi"
    }[activity.type];

    return (
        <div className="bg-[#1A202C]/40 hover:bg-[#1A202C]/60 border border-white/5 hover:border-primary/20 rounded-2xl overflow-hidden transition-all duration-300 group shadow-xl backdrop-blur-md">
            <div className="p-3">
                {/* Header: User Info */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/profile/${activity.user.id}`}
                            className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all flex-shrink-0"
                        >
                            {activity.user.image ? (
                                <Image src={activity.user.image} alt={activity.user.name || ""} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                    <User className="w-3 h-3 text-neutral-500" />
                                </div>
                            )}
                        </Link>
                        <div className="min-w-0">
                            <Link 
                                href={`/profile/${activity.user.id}`}
                                className="text-[12px] font-black text-white hover:text-primary transition-colors truncate block leading-none"
                            >
                                {activity.user.name}
                            </Link>
                        </div>
                    </div>
                    <span className="text-[8px] text-neutral-600 font-bold uppercase">{timeLabel}</span>
                </div>

                {/* Main Content Area: Side by Side */}
                <div className="flex gap-3 mb-3">
                    {/* Small Poster - Tam sığacak şekilde aspect-2/3 */}
                    <div 
                        className="relative w-[70px] aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-neutral-900 group/media cursor-pointer shadow-lg ring-1 ring-white/10"
                        onClick={handleDoubleTap}
                    >
                        {activity.media.posterPath ? (
                            <Image
                                src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                                alt={activity.media.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover/media:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                        )}
                        
                        {/* Double Tap Heart Animation (Small) */}
                        {showHeartAnim && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-heart-burst">
                                <Heart className="w-10 h-10 text-white fill-white drop-shadow-2xl" />
                            </div>
                        )}

                        {/* Rating Badge */}
                        {activity.rating && (
                            <div className="absolute bottom-1 right-1 bg-primary text-background text-[8px] font-black px-1 py-0.5 rounded shadow-xl flex items-center gap-0.5">
                                <Star className="w-2 h-2 fill-current" />
                                {activity.rating}
                            </div>
                        )}
                    </div>

                    {/* Media Details & Action Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight leading-none">{actionText}</p>
                            <Link 
                                href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                                className="text-[13px] font-black text-white hover:text-primary transition-colors line-clamp-2 leading-tight"
                            >
                                {activity.media.title}
                            </Link>
                            {activity.episode && (
                                <span className="text-[9px] text-blue-400 font-bold uppercase">S{activity.episode.seasonNumber} E{activity.episode.episodeNumber}</span>
                            )}
                            {activity.episodeRange && (
                                <span className="text-[9px] text-blue-400 font-bold uppercase">S{activity.episodeRange.seasonNumber} E{activity.episodeRange.fromEpisode}-{activity.episodeRange.toEpisode}</span>
                            )}
                        </div>

                        {/* Social Buttons */}
                        <div className="flex items-center gap-4 mt-2">
                            <button 
                                onClick={handleLike}
                                className={cn(
                                    "transition-all hover:scale-125 active:scale-90 flex items-center gap-1.5",
                                    isLiked ? "text-red-500" : "text-neutral-400 hover:text-red-500"
                                )}
                            >
                                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                                <span className="text-[10px] font-black">{likesCount}</span>
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const next = !showComments;
                                    setShowComments(next);
                                    if (next && comments.length === 0) {
                                        fetchComments();
                                    }
                                }}
                                className={cn(
                                    "transition-all hover:scale-125 active:scale-90 flex items-center gap-1.5",
                                    showComments ? "text-primary" : "text-neutral-400 hover:text-primary"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-[10px] font-black">{activity._count.comments || comments.length}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Review/Content if exists */}
                {activity.review && (
                    <div className="px-1 mb-2 bg-white/5 p-2 rounded-xl border border-white/5">
                        <p className="text-[10px] text-neutral-300 leading-relaxed line-clamp-2 italic">
                            &quot;{activity.review}&quot;
                        </p>
                    </div>
                )}

                {/* Quick Comment Input */}
                <form onSubmit={handleCommentSubmit} className="relative mt-2 border-t border-white/5 pt-2">
                    <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Yorum ekle..."
                        className="w-full bg-transparent text-[10px] text-white py-1 pr-8 outline-none placeholder:text-neutral-600 font-medium"
                    />
                    {commentInput.trim() && (
                        <button
                            disabled={submitting}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Paylaş"}
                        </button>
                    )}
                </form>

                {/* Comments List (Conditional) */}
                {showComments && (
                    <div className="mt-2 space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar animate-in slide-in-from-top-1 duration-200">
                        {loadingComments ? (
                            <div className="flex justify-center py-2">
                                <Loader2 className="w-3 h-3 text-primary/50 animate-spin" />
                            </div>
                        ) : comments.length === 0 ? null : (
                            <div className="space-y-1.5">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-1.5">
                                        <span className="text-[9px] font-black text-white shrink-0">{c.user.name}</span>
                                        <p className="text-[9px] text-neutral-400 leading-tight flex-1">{c.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
