"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Heart,
    MessageSquare,
    Share2,
    Star,
    MoreHorizontal,
    CheckCircle2,
    PlusCircle,
    StarHalf,
    Film,
    Tv,
    Clock,
    User,
    X,
    Send,
    Instagram,
    Copy,
    MessageCircle,
    Users,
    Loader2,
    Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addActivityComment, getActivityComments } from "@/lib/comment-actions";

type ActivityPostProps = {
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

export function ActivityPost({ activity }: ActivityPostProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Set random likes count on client side only to avoid hydration mismatch
    useEffect(() => {
        setLikesCount(Math.floor(Math.random() * 50));
    }, []);

    useEffect(() => {
        if (showComments) {
            fetchComments();
        }
    }, [showComments]);

    const fetchComments = async () => {
        setLoadingComments(true);
        const data = await getActivityComments(activity.id);
        setComments(data);
        setLoadingComments(false);
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim() || submitting) return;

        setSubmitting(true);
        const res = await addActivityComment(activity.id, commentInput);
        setSubmitting(false);

        if (res.success) {
            setCommentInput("");
            fetchComments();
            // Optional: Increment visible count locally if needed
        }
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/${activity.media.type.toLowerCase()}/${activity.media.tmdbId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsapp = () => {
        const url = `${window.location.origin}/${activity.media.type.toLowerCase()}/${activity.media.tmdbId}`;
        const text = encodeURIComponent(`Şuna baksana: ${activity.media.title} - ${url}`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const actionText = {
        WATCHED: "izledi",
        RATED: "puan verdi",
        REVIEWED: "inceledi",
        ADDED_TO_LIST: "listesine ekledi",
    }[activity.type];

    const actionIcon = {
        WATCHED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        RATED: <Star className="w-4 h-4 text-amber-400 fill-current" />,
        REVIEWED: <StarHalf className="w-4 h-4 text-primary" />,
        ADDED_TO_LIST: <PlusCircle className="w-4 h-4 text-blue-400" />,
    }[activity.type];

    const formatRuntime = (minutes: number) => {
        if (!minutes) return "";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? (m > 0 ? `${h}s ${m}dk` : `${h}s`) : `${m}dk`;
    };

    return (
        <div className="bg-[#1A202C]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-primary/20 group animate-fade-in mb-8">
            <div className="flex flex-col md:flex-row min-h-[300px]">

                {/* Left Side: Media Image (Poster) */}
                <div className="relative w-full md:w-[240px] shrink-0 bg-neutral-900 group/poster overflow-hidden">
                    {activity.media.posterPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w500${activity.media.posterPath}`}
                            alt={activity.media.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover/poster:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                    )}

                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                        {activity.media.type === "MOVIE" ? <Film className="w-3 h-3 text-primary" /> : <Tv className="w-3 h-3 text-primary" />}
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{activity.media.type === "MOVIE" ? "Film" : "Dizi"}</span>
                    </div>

                    {activity.rating && (
                        <div className="absolute bottom-4 left-4 bg-primary px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-background text-background" />
                            <span className="text-sm font-black text-background">{activity.rating}</span>
                        </div>
                    )}
                </div>

                {/* Right Side: Content Area */}
                <div className="flex-1 flex flex-col p-6 md:p-8 bg-gradient-to-br from-white/[0.01] to-transparent">
                    {/* Top Row: User & Date */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${activity.user.id}`} className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/5 group-hover:ring-primary/40 transition-all">
                                {activity.user.image ? (
                                    <Image
                                        src={activity.user.image}
                                        alt={activity.user.name || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/profile/${activity.user.id}`} className="text-sm font-bold text-white hover:text-primary transition-colors">
                                        {activity.user.name}
                                    </Link>
                                    <span className="text-[11px] text-neutral-400 mt-0.5">
                                        {actionText}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-neutral-500 flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                                    </p>
                                    {activity.watchedWith && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-medium text-blue-400 border border-white/5">
                                            <Users className="w-3 h-3" />
                                            {(() => {
                                                try {
                                                    const parsed = JSON.parse(activity.watchedWith);
                                                    return Array.isArray(parsed) ? parsed.join(", ") : parsed;
                                                } catch (e) {
                                                    return activity.watchedWith;
                                                }
                                            })()} ile
                                        </div>
                                    )}
                                    {(activity.recommendedBy || activity.recommendedByText) && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-medium text-purple-400 border border-white/5">
                                            <Sparkles className="w-3 h-3" />
                                            {activity.recommendedBy?.name || activity.recommendedByText} tavsiyesiyle
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="p-2 text-neutral-600 hover:text-white transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Media Title */}
                    <div className="mb-4 flex items-baseline gap-3 flex-wrap">
                        <Link
                            href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                            className="text-2xl font-black text-white hover:text-primary transition-all tracking-tight leading-none"
                        >
                            {activity.media.title}
                        </Link>
                        {activity.media.runtime && (
                            <span className="inline-flex items-center gap-1.5 text-neutral-500 font-bold text-[11px] leading-none mb-1">
                                <Clock className="w-3 h-3" />
                                {formatRuntime(activity.media.runtime)}
                            </span>
                        )}

                        {/* Episode Range Badge */}
                        {activity.episodeRange && (
                            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <Tv className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-bold text-blue-400">
                                    {activity.episodeRange.seasonNumber}. Sezon {activity.episodeRange.fromEpisode}-{activity.episodeRange.toEpisode}. Bölümler
                                </span>
                                <span className="text-xs text-blue-400/60">({activity.episodeRange.count} bölüm)</span>
                            </div>
                        )}

                        {/* Single Episode Badge */}
                        {activity.episode && !activity.episodeRange && (
                            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <Tv className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-400">
                                    {activity.episode.seasonNumber}. Sezon {activity.episode.episodeNumber}. Bölüm
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                        {activity.review ? (
                            <div className="relative p-5 bg-white/5 border-l-2 border-primary rounded-r-2xl">
                                <p className="text-sm text-neutral-300 leading-relaxed italic">
                                    “{activity.review}”
                                </p>
                            </div>
                        ) : (
                            <p className="text-neutral-500 text-xs italic py-2">Henüz bir yorum eklenmemiş.</p>
                        )}
                    </div>

                    {/* Bottom: Interatons */}
                    <div className="mt-8 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={handleLike}
                                    className={cn(
                                        "flex items-center gap-2 transition-all hover:scale-110",
                                        isLiked ? "text-pink-500 animate-pulse" : "text-neutral-400 hover:text-pink-500"
                                    )}
                                >
                                    <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                                    <span className="text-xs font-bold">{likesCount}</span>
                                </button>
                                <button
                                    onClick={() => setShowComments(!showComments)}
                                    className={cn(
                                        "flex items-center gap-2 transition-all hover:scale-110",
                                        showComments ? "text-primary" : "text-neutral-400 hover:text-primary"
                                    )}
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    <span className="text-xs font-bold">{activity._count?.comments || 0}</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowShare(!showShare)}
                                className="p-2 text-neutral-400 hover:text-blue-400 rounded-lg hover:bg-blue-400/5 transition-all"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List & Input Section */}
            {showComments && (
                <div className="border-t border-white/5 bg-white/[0.02] p-6 space-y-6 animate-fade-in">
                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-4">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                            <User className="w-full h-full text-neutral-600 p-1.5 bg-neutral-800" />
                        </div>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Yorum ekle..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all outline-none"
                            />
                            <button
                                disabled={submitting || !commentInput.trim()}
                                className="px-4 py-2 bg-primary text-background font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "GÖNDER"}
                            </button>
                        </div>
                    </form>

                    {/* Existing Comments */}
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {loadingComments ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-center text-neutral-500 text-xs py-4 italic">Henüz yorum yapılmamış.</p>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="flex gap-3 animate-fade-in">
                                    <Link href={`/profile/${c.user.id}`} className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10">
                                        {c.user.image ? (
                                            <Image src={c.user.image} alt={c.user.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500"><User className="w-4 h-4" /></div>
                                        )}
                                    </Link>
                                    <div className="bg-white/5 rounded-2xl px-4 py-2 flex-1 border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <Link href={`/profile/${c.user.id}`} className="text-[11px] font-bold text-white hover:text-primary transition-colors">
                                                {c.user.name}
                                            </Link>
                                            <span className="text-[9px] text-neutral-500 font-medium italic">
                                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: tr })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                                            {c.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShare && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowShare(false)}>
                    <div className="relative w-full max-w-[280px] bg-[#1A202C] border border-white/10 rounded-3xl p-6 shadow-3xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black text-white mb-6 text-center tracking-tight">İçeriği Paylaş</h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button onClick={shareOnWhatsapp} className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-emerald-500/10 transition-all group">
                                <MessageCircle className="w-6 h-6 text-emerald-500 transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-bold text-neutral-400 tracking-tight">WhatsApp</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-pink-500/10 transition-all group">
                                <Instagram className="w-6 h-6 text-pink-500 transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-bold text-neutral-400 tracking-tight">Instagram</span>
                            </button>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-bold border transition-all",
                                copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500" : "bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10"
                            )}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Kopyalandı!" : "Linki Kopyala"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
