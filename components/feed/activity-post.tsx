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
    MapPin,
    ChevronRight,
    Bookmark
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addActivityComment, getActivityComments } from "@/lib/comment-actions";
import { voteActivity } from "@/lib/activity-actions";

type ActivityPostProps = {
    activity: {
        id: string;
        type: "WATCHED" | "RATED" | "REVIEWED";
        createdAt: Date;
        rating: number | null;
        review: string | null;
        watchedWith: string | null;
        recommendedByText: string | null;
        votes: number;
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
            releaseDate?: Date | string | null;
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

    // Set likes count from activity
    useEffect(() => {
        setLikesCount(activity.votes || 0);
    }, [activity.votes]);

    useEffect(() => {
        setTimeLabel(formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr }));
    }, [activity.createdAt]);

    const fetchComments = async () => {
        setLoadingComments(true);
        const data = await getActivityComments(activity.id);
        setComments(data);
        setLoadingComments(false);
    };

    useEffect(() => {
        if (showComments) {
            fetchComments();
        }
    }, [showComments]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
        
        await voteActivity(activity.id, newIsLiked ? 1 : -1);
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

    const getAvatarGradient = (name: string) => {
        const gradients = [
            "linear-gradient(135deg,#f472b6,#be185d)",
            "linear-gradient(135deg,#38bdf8,#1d4ed8)",
            "linear-gradient(135deg,#34d399,#047857)",
            "linear-gradient(135deg,#fbbf24,#b45309)",
            "linear-gradient(135deg,#a78bfa,#6d28d9)",
            "linear-gradient(135deg,#f4c14e,#b45309)",
        ];
        let sum = 0;
        const displayName = name || "User";
        for (let i = 0; i < displayName.length; i++) sum += displayName.charCodeAt(i);
        return gradients[sum % gradients.length];
    };

    const avatarGradient = getAvatarGradient(activity.user.name || "");
    const initial = (activity.user.name || "U").substring(0, 1).toUpperCase();
    const actionLabel = activity.type === "REVIEWED" ? "inceledi" : activity.rating ? "izledi ve puanladı" : "izledi";
    const yearMeta = activity.media.releaseDate ? new Date(activity.media.releaseDate).getFullYear() : "";
    const typeMeta = activity.media.type === "MOVIE" ? "Film" : "Dizi";
    const runtimeMeta = activity.media.runtime ? formatRuntime(activity.media.runtime) : "";
    const fullMeta = [typeMeta, yearMeta, runtimeMeta].filter(Boolean).join(" · ");

    return (
        <div className="bg-[#0b1120] border border-white/5 rounded-2xl p-4 shadow-lg transition-all hover:border-white/10 group animate-fade-in relative font-hanken">
            <div className="flex gap-3.5 items-start">
                
                {/* User Avatar */}
                <Link href={`/profile/${activity.user.id}`} className="shrink-0">
                    {activity.user.image ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 relative">
                            <Image src={activity.user.image} alt={activity.user.name || "User"} fill className="object-cover" />
                        </div>
                    ) : (
                        <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bricolage font-bold text-base text-white shadow-inner"
                            style={{ background: avatarGradient }}
                        >
                            {initial}
                        </div>
                    )}
                </Link>

                {/* User Action Header */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm leading-relaxed text-slate-300">
                        <Link href={`/profile/${activity.user.id}`} className="font-extrabold text-white hover:text-primary transition-colors mr-1">
                            {activity.user.name}
                        </Link>
                        {actionLabel} <span className="font-semibold text-primary">{activity.media.title}</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5 tracking-wide">
                        {timeLabel}
                    </div>
                </div>

                {/* Rating Badge */}
                {activity.rating && (
                    <div className="flex items-center gap-0.5 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-mono text-xs font-bold text-primary font-mono">{activity.rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* User Review Note */}
            {activity.review && (
                <div className="mt-3">
                    <div 
                        className={cn(
                            "text-sm leading-relaxed text-slate-200 p-3.5 bg-white/[0.03] border-l-[3px] border-amber-400/80 rounded-r-2xl relative transition-all duration-300",
                            !isExpanded && activity.review.length > 220 && "line-clamp-3"
                        )}
                    >
                        <Quote className="w-4 h-4 text-amber-400/50 mb-1 inline mr-1.5 shrink-0" />
                        <span className="whitespace-pre-line font-medium">{activity.review}</span>
                    </div>
                    {activity.review.length > 220 && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline pl-1 inline-flex items-center gap-1 transition-colors"
                        >
                            {isExpanded ? "Daha az göster" : "Daha fazla oku..."}
                        </button>
                    )}
                </div>
            )}

            {/* Media Item Detail Row */}
            <Link 
                href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                className="flex gap-3 items-center mt-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl p-2.5 transition-colors group/media"
            >
                <div className="relative w-11 aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                    {activity.media.posterPath ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w185${activity.media.posterPath}`}
                            alt={activity.media.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white group-hover/media:text-primary transition-colors tracking-tight line-clamp-1">
                        {activity.media.title}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-500 tracking-wide">
                            {fullMeta}
                        </span>
                        
                        {activity.episodeRange && (
                            <span className="font-mono text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                                S{activity.episodeRange.seasonNumber} E{activity.episodeRange.fromEpisode}-{activity.episodeRange.toEpisode}
                            </span>
                        )}

                        {activity.episode && !activity.episodeRange && (
                            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                                S{activity.episode.seasonNumber} E{activity.episode.episodeNumber}
                            </span>
                        )}
                    </div>
                </div>
                
                <ChevronRight size={18} className="text-slate-600 group-hover/media:text-slate-400 transition-colors" />
            </Link>

            {/* Action Buttons Bar */}
            <div className="flex gap-5 items-center mt-3.5 pt-3.5 border-t border-white/5">
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-1.5 transition-all text-slate-500 hover:scale-105 hover:text-pink-500",
                        isLiked && "text-pink-500"
                    )}
                >
                    <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} />
                    <span className="font-mono text-xs font-bold text-slate-400">{likesCount}</span>
                </button>
                
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowComments(!showComments);
                    }}
                    className={cn(
                        "flex items-center gap-1.5 transition-all text-slate-500 hover:scale-105 hover:text-primary",
                        showComments && "text-primary"
                    )}
                >
                    <MessageSquare className="w-[18px] h-[18px]" />
                    <span className="font-mono text-xs font-bold text-slate-400">{activity._count?.comments || comments.length || 0}</span>
                </button>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowShare(!showShare);
                    }}
                    className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <Share2 className="w-[18px] h-[18px]" />
                </button>

                <button
                    className="text-slate-500 hover:text-primary transition-colors"
                    aria-label="Kaydet"
                >
                    <Bookmark className="w-[18px] h-[18px]" />
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-white/5 bg-white/[0.02] p-3 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleCommentSubmit} className="flex gap-2" onClick={e => e.stopPropagation()}>
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
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={e => { e.preventDefault(); e.stopPropagation(); setShowShare(false); }}>
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
