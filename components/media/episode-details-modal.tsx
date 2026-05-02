"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, ThumbsUp, ThumbsDown, Send, User, Check, Eye, Play, ArrowLeft, EyeOff, AlertTriangle, Loader2, MessageSquare, Star } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ExpandableImage } from "@/components/ui/expandable-image";
import { cn } from "@/lib/utils";

type Episode = {
    id: string;
    title?: string;
    episode_number?: number;
    overview?: string;
    still_path?: string;
    air_date?: string;
    runtime?: number;
    ratings?: Array<{ rating: number }>;
    name?: string;
    vote_average?: number;
};

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    user: { name: string | null; image: string | null };
};

type EpisodeDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    episode: Episode;
    isWatched: boolean;
    onToggleWatch: () => Promise<void>;
    onRate: (rating: number) => Promise<void>;
    onAddComment: (text: string, isSpoiler: boolean) => Promise<void>;
    comments: Comment[];
    isPending: boolean;
    initialTab?: "details" | "comments";
};

export function EpisodeDetailsModal({
    isOpen,
    onClose,
    episode,
    isWatched,
    onToggleWatch,
    onRate,
    onAddComment,
    comments,
    isPending,
    initialTab = "details"
}: EpisodeDetailsModalProps) {
    const [commentText, setCommentText] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [mounted, setMounted] = useState(false);
    const commentsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mounted) setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
            if (initialTab === "comments") {
                setTimeout(() => {
                    commentsRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 400);
            }
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen, mounted, initialTab]);

    if (!episode || !mounted) return null;

    const currentRating = episode.ratings?.[0]?.rating;

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isPending) return;
        await onAddComment(commentText, isSpoiler);
        setCommentText("");
        setIsSpoiler(false);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#070c16]/95 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full h-full md:h-[90vh] md:max-w-6xl bg-[#0f172a] md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10"
                    >
                        {/* Close Button - Floating */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-[70] p-3 bg-black/40 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 backdrop-blur-xl group shadow-2xl"
                        >
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* LEFT: CONTENT SECTION */}
                        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-[#1e293b]">
                            {/* Hero Image */}
                            <div className="relative w-full aspect-video md:h-[55%] group">
                                {episode.still_path ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/original${episode.still_path}`}
                                        alt={episode.name || "Episode"}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#1e293b] flex items-center justify-center">
                                        <Play size={64} className="text-white/5" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                                
                                {/* Episode Info Overlay */}
                                <div className="absolute bottom-8 left-8 right-8">
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-center gap-3 mb-4"
                                    >
                                        <span className="px-4 py-1.5 bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl italic shadow-[0_8px_20px_rgba(251,191,36,0.3)]">
                                            Bölüm {episode.episode_number}
                                        </span>
                                        {isWatched && (
                                            <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs uppercase tracking-widest rounded-xl backdrop-blur-md">
                                                <Check size={14} strokeWidth={3} /> İzlendi
                                            </span>
                                        )}
                                        {episode.vote_average && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 text-amber-400 border border-white/10 font-black text-xs rounded-xl backdrop-blur-md">
                                                <Star size={12} fill="currentColor" /> {episode.vote_average.toFixed(1)}
                                            </span>
                                        )}
                                    </motion.div>
                                    <motion.h2 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] italic"
                                    >
                                        {episode.name}
                                    </motion.h2>
                                </div>
                            </div>

                            {/* Details Content */}
                            <div className="p-8 md:p-12 space-y-10">
                                <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                                    {episode.air_date && (
                                        <div className="flex items-center gap-2.5">
                                            <Calendar size={16} className="text-amber-400/60" />
                                            <span>{new Date(episode.air_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {episode.runtime && (
                                        <div className="flex items-center gap-2.5">
                                            <Clock size={16} className="text-amber-400/60" />
                                            <span>{episode.runtime} Dakika</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="w-12 h-1 bg-amber-400 rounded-full" />
                                    <p className="text-lg md:text-2xl text-white/80 leading-relaxed font-medium">
                                        {episode.overview || "Bu bölüm için henüz bir özet girilmemiş."}
                                    </p>
                                </div>

                                {/* Main Interaction Bar */}
                                <div className="flex flex-wrap items-center gap-4 pt-4">
                                    <button
                                        disabled={isPending}
                                        onClick={onToggleWatch}
                                        className={cn(
                                            "flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black uppercase text-sm transition-all active:scale-95 shadow-2xl",
                                            isWatched
                                                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                                                : "bg-white text-black hover:bg-neutral-200 shadow-white/10"
                                        )}
                                    >
                                        {isPending ? <Loader2 size={20} className="animate-spin" /> : <Eye size={20} className={cn(isWatched && "fill-current")} />}
                                        {isWatched ? "İzlemeyi Kaldır" : "İzledim İşaretle"}
                                    </button>

                                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                                        <button
                                            onClick={() => onRate(1)}
                                            className={cn(
                                                "flex items-center gap-2 px-8 py-4 rounded-[1.5rem] transition-all",
                                                currentRating === 1 ? "bg-amber-400 text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <ThumbsUp size={20} className={cn(currentRating === 1 ? "fill-current" : "")} />
                                            <span className="font-black text-xs uppercase italic tracking-widest">Beğen</span>
                                        </button>
                                        <button
                                            onClick={() => onRate(0)}
                                            className={cn(
                                                "flex items-center gap-2 px-8 py-4 rounded-[1.5rem] transition-all",
                                                currentRating === 0 ? "bg-rose-500 text-white shadow-lg" : "text-white/40 hover:text-rose-400 hover:bg-rose-500/5"
                                            )}
                                        >
                                            <ThumbsDown size={20} className={cn(currentRating === 0 ? "fill-current" : "")} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: COMMENTS SECTION (Social App style) */}
                        <div 
                            ref={commentsRef}
                            className="w-full md:w-[480px] bg-[#070c16] border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-full overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                        Yorumlar
                                    </h3>
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mt-1">
                                        {comments.length} Toplam Mesaj
                                    </p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <MessageSquare size={20} className="text-white/20" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {comments.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-10">
                                        <MessageSquare size={64} className="mb-6" />
                                        <p className="text-sm font-black uppercase tracking-[0.3em] italic">Henüz yorum yapılmamış.</p>
                                    </div>
                                ) : (
                                    comments.map((c: any) => (
                                        <CommentItem key={c.id} comment={c} />
                                    ))
                                )}
                            </div>

                            {/* Comment Input Section */}
                            <div className="p-6 md:p-8 bg-[#0f172a] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.3)]">
                                <form onSubmit={handleSubmitComment} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsSpoiler(!isSpoiler)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                                                isSpoiler 
                                                    ? "bg-rose-500/20 border-rose-500 text-rose-500" 
                                                    : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"
                                            )}
                                        >
                                            <EyeOff size={14} /> Spoiler?
                                        </button>
                                        <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Yorum Kuralları</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Bölüm hakkındaki düşüncelerin..."
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-bold"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || isPending}
                                            className="bg-amber-400 text-black p-5 rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_10px_25px_rgba(251,191,36,0.3)]"
                                        >
                                            <Send size={24} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function CommentItem({ comment }: { comment: any }) {
    const [isRevealed, setIsRevealed] = useState(!comment.isSpoiler);

    return (
        <div className="space-y-4 group">
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/5 shrink-0 overflow-hidden ring-1 ring-white/10 shadow-xl group-hover:scale-110 transition-transform">
                    {comment.user?.image ? (
                        <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                            <User size={20} />
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white uppercase italic tracking-tight">
                            {comment.user?.name || "Kullanıcı"}
                        </p>
                        {comment.isSpoiler && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-rose-500/30">SPOILER</span>
                        )}
                    </div>
                    <p className="text-[9px] font-bold text-white/20 uppercase mt-1 tracking-widest">
                        {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                </div>
            </div>
            <div
                onClick={() => comment.isSpoiler && setIsRevealed(true)}
                className={cn(
                    "relative bg-white/[0.03] border border-white/5 rounded-3xl rounded-tl-none p-5 transition-all",
                    !isRevealed && "cursor-pointer hover:bg-white/[0.06] border-rose-500/20",
                    isRevealed ? "group-hover:bg-white/[0.05]" : ""
                )}
            >
                <p className={cn(
                    "text-sm text-white/70 font-medium leading-relaxed transition-all duration-700",
                    !isRevealed && "blur-xl select-none opacity-20"
                )}>
                    {comment.content}
                </p>

                {comment.isSpoiler && !isRevealed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <EyeOff size={18} className="text-rose-500" />
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Spoilerı Oku</span>
                    </div>
                )}
            </div>
        </div>
    );
}
