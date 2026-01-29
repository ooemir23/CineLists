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

    const formatRuntime = (minutes: number) => {
        if (!minutes) return "";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? (m > 0 ? `${h}s ${m}dk` : `${h}s`) : `${m}dk`;
    };

    return (
        <div className="bg-[#1A202C]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-primary/20 group animate-fade-in mb-10">
            <div className="flex flex-col md:flex-row min-h-[340px]">

                {/* Left Side: Media Image (Poster) */}
                <div className="relative w-full md:w-[260px] shrink-0 bg-neutral-900 group/poster overflow-hidden">
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
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                        {activity.media.type === "MOVIE" ? <Film className="w-3.5 h-3.5 text-primary" /> : <Tv className="w-3.5 h-3.5 text-primary" />}
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{activity.media.type === "MOVIE" ? "Film" : "Dizi"}</span>
                    </div>

                    {/* Rating Overlay on Poster */}
                    {activity.rating && (
                        <div className="absolute bottom-6 left-6 flex items-center gap-2">
                            <div className="bg-primary px-4 py-2 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
                                <Star className="w-4 h-4 fill-background text-background" />
                                <span className="text-lg font-black text-background">{activity.rating}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Content Area */}
                <div className="flex-1 flex flex-col p-6 md:p-10 bg-gradient-to-br from-white/[0.02] to-transparent">

                    {/* User Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href={`/profile/${activity.user.id}`} className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/5 group-hover:ring-primary/40 transition-all shadow-xl">
                                {activity.user.image ? (
                                    <Image src={activity.user.image} alt={activity.user.name || "User"} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                                        <User className="w-6 h-6" />
                                    </div>
                                )}
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/profile/${activity.user.id}`} className="text-base font-black text-white hover:text-primary transition-colors tracking-tight">
                                        {activity.user.name}
                                    </Link>
                                    <span className="text-xs font-bold text-neutral-500 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 uppercase tracking-wider">
                                        {actionText}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1.5">
                                    <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                                    </p>
                                    {activity.platform && (
                                        <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {activity.platform}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="p-2.5 text-neutral-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Media Details Section */}
                    <div className="mb-6 space-y-4">
                        <div className="flex items-baseline gap-4 flex-wrap">
                            <Link
                                href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                                className="text-3xl font-black text-white hover:text-primary transition-all tracking-tighter leading-tight"
                            >
                                {activity.media.title}
                            </Link>
                            {activity.media.runtime && (
                                <span className="inline-flex items-center gap-1.5 text-neutral-500 font-bold text-xs uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatRuntime(activity.media.runtime)}
                                </span>
                            )}
                        </div>

                        {/* Special Badges (Episode/Season) */}
                        <div className="flex flex-wrap gap-3">
                            {activity.episodeRange && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-inner">
                                    <Tv className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-black text-blue-400">
                                        {activity.episodeRange.seasonNumber}. Sezon {activity.episodeRange.fromEpisode}-{activity.episodeRange.toEpisode}. Bölümler
                                    </span>
                                    <span className="text-xs text-blue-300/50 font-bold px-1.5 py-0.5 bg-blue-400/10 rounded-lg">{activity.episodeRange.count} BÖLÜM</span>
                                </div>
                            )}

                            {activity.episode && !activity.episodeRange && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-inner">
                                    <Tv className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-black text-emerald-400">
                                        {activity.episode.seasonNumber}. Sezon {activity.episode.episodeNumber}. Bölüm
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Details: Watched With & Recommended By */}
                    {(activity.watchedWith || activity.recommendedBy || activity.recommendedByText) && (
                        <div className="flex flex-wrap gap-4 mb-6">
                            {activity.watchedWith && (
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-500/5 rounded-[1.25rem] border border-blue-500/10 group/meta transition-all hover:bg-blue-500/10">
                                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-blue-500/60 tracking-[0.1em]">Birlikte İzledi</span>
                                        <span className="text-xs font-bold text-blue-300">
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
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-500/5 rounded-[1.25rem] border border-purple-500/10 group/meta transition-all hover:bg-purple-500/10">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-purple-500/60 tracking-[0.1em]">Tavsiye Eden</span>
                                        <span className="text-xs font-bold text-purple-300">
                                            {activity.recommendedBy?.name || activity.recommendedByText}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review content with better styling */}
                    <div className="flex-1 mb-8">
                        {activity.review ? (
                            <div className="relative p-6 bg-white/[0.03] border-l-4 border-primary rounded-r-[2rem] shadow-inner group/review overflow-hidden">
                                <Quote className="absolute -top-2 -right-2 w-16 h-16 text-white/5 -rotate-12 group-hover/review:rotate-0 transition-transform duration-700" />
                                <p className="relative z-10 text-[15px] text-neutral-200 leading-relaxed font-medium">
                                    {activity.review}
                                </p>
                            </div>
                        ) : (
                            <div className="h-px w-full bg-gradient-to-r from-white/5 to-transparent" />
                        )}
                    </div>

                    {/* Bottom: Interactions */}
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center gap-2.5 transition-all hover:scale-110",
                                    isLiked ? "text-pink-500" : "text-neutral-400 hover:text-pink-500"
                                )}
                            >
                                <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
                                <span className="text-sm font-black">{likesCount}</span>
                            </button>
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={cn(
                                    "flex items-center gap-2.5 transition-all hover:scale-110",
                                    showComments ? "text-primary" : "text-neutral-400 hover:text-primary"
                                )}
                            >
                                <MessageSquare className="w-6 h-6" />
                                <span className="text-sm font-black">{activity._count?.comments || 0}</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowShare(!showShare)}
                            className="p-3 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-white/5 bg-white/[0.02] p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <form onSubmit={handleCommentSubmit} className="flex gap-4">
                        <div className="relative w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-neutral-900 shadow-lg">
                            <User className="w-full h-full text-neutral-500 p-2" />
                        </div>
                        <div className="flex-1 flex gap-3">
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Yorumun nedir?"
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-neutral-600 font-medium"
                            />
                            <button
                                disabled={submitting || !commentInput.trim()}
                                className="px-6 py-3 bg-primary text-background font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin text-background" /> : <>GÖNDER <Send className="w-3 h-3" /></>}
                            </button>
                        </div>
                    </form>

                    <div className="space-y-5 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                        {loadingComments ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="w-8 h-8 text-primary/50 animate-spin" />
                                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Yorumlar yükleniyor</span>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-12 px-10 border-2 border-dashed border-white/5 rounded-[2rem]">
                                <MessageCircle className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
                                <p className="text-neutral-500 text-sm font-bold uppercase tracking-tight">İlk yorumu sen yap!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((c) => (
                                    <div key={c.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <Link href={`/profile/${c.user.id}`} className="relative w-10 h-10 rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/10 shadow-lg">
                                            {c.user.image ? (
                                                <Image src={c.user.image} alt={c.user.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500"><User className="w-5 h-5" /></div>
                                            )}
                                        </Link>
                                        <div className="bg-white/5 rounded-[1.5rem] px-5 py-4 flex-1 border border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <Link href={`/profile/${c.user.id}`} className="text-sm font-black text-white hover:text-primary transition-colors tracking-tight">
                                                    {c.user.name}
                                                </Link>
                                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter italic">
                                                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: tr })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-neutral-300 leading-relaxed font-medium">
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
