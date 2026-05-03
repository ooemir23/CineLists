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
    Sparkles,
    Quote,
    MapPin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addActivityComment, getActivityComments } from "@/lib/comment-actions";

type ActivityPostProps = {
    activity: {
        id: string;
        type: "WATCHED" | "RATED" | "REVIEWED";
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
    const [timeLabel, setTimeLabel] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    // Set random likes count on client side only to avoid hydration mismatch
    useEffect(() => {
        setLikesCount(Math.floor(Math.random() * 50));
    }, []);

    useEffect(() => {
        setTimeLabel(formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr }));
    }, [activity.createdAt]);

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

    }[activity.type];

    const formatRuntime = (minutes: number) => {
        if (!minutes) return "";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? (m > 0 ? `${h}s ${m}dk` : `${h}s`) : `${m}dk`;
    };

    return (
        <div id={`activity-${activity.id}`} className="bg-[#131b2c]/70 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-primary/20 group animate-fade-in">
            <div className="flex flex-row min-h-[120px]">

                {/* Left Side: Media Image (Poster) */}
                <div className="relative w-[120px] sm:w-[170px] aspect-[2/3] shrink-0 bg-neutral-900 group/poster overflow-hidden border-r border-white/5">
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

                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
                        {activity.media.type === "MOVIE" ? <Film className="w-2.5 h-2.5 text-primary" /> : <Tv className="w-2.5 h-2.5 text-primary" />}
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">{activity.media.type === "MOVIE" ? "Film" : "Dizi"}</span>
                    </div>

                    {/* Rating Overlay on Poster */}
                    {activity.rating && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-2">
                            <div className="bg-primary px-2 py-1 rounded-lg shadow-2xl border border-white/20 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-background text-background" />
                                <span className="text-xs font-black text-background">{activity.rating}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Content Area */}
                <div className="flex-1 flex flex-col p-3 sm:p-4 bg-gradient-to-br from-white/[0.02] to-transparent relative">

                    {/* User Header */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5 uppercase tracking-wider whitespace-nowrap">
                                    {actionText}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[9px] text-neutral-500 flex items-center gap-1 font-bold uppercase tracking-wider whitespace-nowrap">
                                    <Clock className="w-3 h-3" />
                                    {timeLabel}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/profile/${activity.user.id}`}
                            className="flex items-center gap-2"
                        >
                            <span className="text-sm font-black text-white hover:text-primary transition-colors tracking-tight truncate max-w-[140px]">
                                {activity.user.name}
                            </span>
                            <span className="relative w-7 h-7 rounded-lg overflow-hidden ring-1 ring-white/5 group-hover:ring-primary/40 transition-all shadow-xl">
                                {activity.user.image ? (
                                    <Image src={activity.user.image} alt={activity.user.name || "User"} fill className="object-cover" />
                                ) : (
                                    <span className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                                        <User className="w-4 h-4" />
                                    </span>
                                )}
                            </span>
                        </Link>
                    </div>

                    {/* Media Details Section */}
                    <div className="mb-2 space-y-1">
                        <div className="flex flex-col gap-1">
                            <Link
                                href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                                className="text-base sm:text-lg font-black text-white hover:text-primary transition-all tracking-tight leading-tight line-clamp-1"
                            >
                                {activity.media.title}
                            </Link>
                            {activity.media.runtime && (
                                <span className="inline-flex items-center gap-1 text-neutral-500 font-bold text-[9px] uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    {formatRuntime(activity.media.runtime)}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {activity.episodeRange && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg shadow-inner">
                                    <Tv className="w-3 h-3 text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-400">
                                        S{activity.episodeRange.seasonNumber} E{activity.episodeRange.fromEpisode}-{activity.episodeRange.toEpisode}
                                    </span>
                                </div>
                            )}

                            {activity.episode && !activity.episodeRange && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shadow-inner">
                                    <Tv className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400">
                                        S{activity.episode.seasonNumber} E{activity.episode.episodeNumber}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Review content with better styling */}
                    <div className="flex-1 mb-2">
                        {activity.review ? (
                            <div 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={cn(
                                    "relative p-3 bg-white/[0.03] border-l-2 border-primary rounded-r-xl shadow-inner group/review overflow-hidden cursor-pointer transition-all duration-300",
                                    isExpanded ? "bg-white/[0.06]" : "hover:bg-white/[0.05]"
                                )}
                            >
                                <p className={cn(
                                    "relative z-10 text-xs text-neutral-300 leading-relaxed font-medium transition-all duration-300",
                                    !isExpanded && "line-clamp-2"
                                )}>
                                    {activity.review}
                                </p>
                                {!isExpanded && activity.review.length > 100 && (
                                    <div className="absolute bottom-1 right-2 text-[8px] font-black text-primary/50 uppercase tracking-widest animate-pulse">Devamını Gör</div>
                                )}
                            </div>
                        ) : (
                            <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent my-2" />
                        )}
                    </div>

                    {/* Meta/Tags (Hidden on extremely small screens if review is long, or just smaller) */}
                    {(activity.watchedWith || activity.recommendedBy || activity.recommendedByText) && (
                        <div className="hidden sm:flex flex-wrap gap-3 mb-3">
                            {activity.watchedWith && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 rounded-2xl border border-blue-500/10 group/meta transition-all hover:bg-blue-500/10">
                                    <div className="w-7 h-7 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Users className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-blue-500/60 tracking-[0.1em]">Birlikte İzledi</span>
                                        <span className="text-[11px] font-bold text-blue-300">
                                            {(() => {
                                                try {
                                                    const parsed = JSON.parse(activity.watchedWith);
                                                    return Array.isArray(parsed) ? parsed.join(", ") : parsed;
                                                } catch (e) {
                                                    return activity.watchedWith;
                                                }
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {(activity.recommendedBy || activity.recommendedByText) && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/5 rounded-2xl border border-purple-500/10 group/meta transition-all hover:bg-purple-500/10">
                                    <div className="w-7 h-7 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-purple-500/60 tracking-[0.1em]">Tavsiye Eden</span>
                                        <span className="text-[11px] font-bold text-purple-300">
                                            {activity.recommendedBy?.name || activity.recommendedByText}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Bottom: Interactions */}
                    <div className="mt-auto px-0 pt-2 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center gap-1.5 transition-all hover:scale-105",
                                    isLiked ? "text-pink-500" : "text-neutral-400 hover:text-pink-500"
                                )}
                            >
                                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                                <span className="text-xs font-black">{likesCount}</span>
                            </button>
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={cn(
                                    "flex items-center gap-1.5 transition-all hover:scale-105",
                                    showComments ? "text-primary" : "text-neutral-400 hover:text-primary"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs font-black">{activity._count?.comments || 0}</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowShare(!showShare)}
                            className="p-1.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/10"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-white/5 bg-white/[0.02] p-3 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Yorumun nedir?"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-neutral-600 font-medium"
                            />
                            <button
                                disabled={submitting || !commentInput.trim()}
                                className="px-3 py-2 bg-primary text-background font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-1"
                            >
                                {submitting ? <Loader2 className="w-3 h-3 animate-spin text-background" /> : <><span className="hidden sm:inline">GÖNDER</span> <Send className="w-3 h-3" /></>}
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {loadingComments ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <Loader2 className="w-6 h-6 text-primary/50 animate-spin" />
                                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Yorumlar yükleniyor</span>
                            </div>
                        ) : comments.length === 0 ? null : (
                            <div className="space-y-3">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <Link href={`/profile/${c.user.id}`} className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10 shadow-lg">
                                            {c.user.image ? (
                                                <Image src={c.user.image} alt={c.user.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500"><User className="w-3.5 h-3.5" /></div>
                                            )}
                                        </Link>
                                        <div className="bg-white/5 rounded-xl px-3 py-2 flex-1 border border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-1">
                                                <Link href={`/profile/${c.user.id}`} className="text-xs font-black text-white hover:text-primary transition-colors tracking-tight">
                                                    {c.user.name}
                                                </Link>
                                                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-tighter italic">
                                                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: tr })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                                                {c.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Share View Overlay */}
            {showShare && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-sm bg-[#1A202C] border border-white/10 rounded-[2.5rem] p-10 shadow-3xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowShare(false)} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                                <Share2 className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase">Paylaş</h3>
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-2">Arkadaşlarına gönder</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button onClick={shareOnWhatsapp} className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group">
                                <MessageCircle className="w-8 h-8 text-emerald-500 transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-black text-neutral-500 group-hover:text-emerald-500 uppercase tracking-widest">WhatsApp</span>
                            </button>
                            <button className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-pink-500/10 hover:border-pink-500/20 transition-all group">
                                <Instagram className="w-8 h-8 text-pink-500 transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-black text-neutral-500 group-hover:text-pink-500 uppercase tracking-widest">Instagram</span>
                            </button>
                        </div>

                        <button
                            onClick={copyToClipboard}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 py-4 rounded-3xl text-[11px] uppercase tracking-[0.2em] font-black border transition-all shadow-xl",
                                copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500 shadow-emerald-500/10" : "bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? "Kopyalandı!" : "Linki Kopyala"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
