"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, ThumbsUp, ThumbsDown, Send, User, Check, Eye, Play, ArrowLeft, EyeOff, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ExpandableImage } from "@/components/ui/expandable-image";
import { cn } from "@/lib/utils";

type EpisodeDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    episode: any;
    isWatched: boolean;
    onToggleWatch: () => Promise<void>;
    onRate: (rating: number) => Promise<void>;
    onAddComment: (text: string, isSpoiler: boolean) => Promise<void>;
    comments: any[];
    isPending: boolean;
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
    isPending
}: EpisodeDetailsModalProps) {
    const [commentText, setCommentText] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

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
                <div className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full h-full bg-neutral-900 overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Back Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 left-6 z-50 p-3 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10 backdrop-blur-md group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        {/* Left Side: Visuals & Info */}
                        <div className="h-[45vh] md:h-full md:w-3/5 relative bg-neutral-900 border-b md:border-b-0 md:border-r border-white/5 overflow-hidden group shrink-0">
                            {/* Background Image */}
                            <div className="absolute inset-0 w-full h-full">
                                {episode.still_path ? (
                                    <ExpandableImage
                                        src={`https://image.tmdb.org/t/p/original${episode.still_path}`}
                                        alt={episode.name}
                                        className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold uppercase tracking-widest">
                                        Fotoğraf Yok
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
                            </div>

                            {/* Content Overlay */}
                            <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 bg-amber-400 rounded-2xl text-slate-950 font-black text-sm uppercase italic shadow-xl">
                                            Bölüm {episode.episode_number}
                                        </div>
                                        {isWatched && (
                                            <div className="px-4 py-2 bg-green-500 rounded-2xl text-white font-black text-sm uppercase italic shadow-xl flex items-center gap-2">
                                                <Check size={16} /> İzlendi
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="text-2xl md:text-6xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                                        {episode.name}
                                    </h2>

                                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-neutral-300 text-[10px] md:text-sm font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-white/10 backdrop-blur-md">
                                            <Calendar size={12} className="text-amber-400 md:w-[14px] md:h-[14px]" />
                                            <span>{episode.air_date ? new Date(episode.air_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Bilinmiyor'}</span>
                                        </div>
                                        {episode.runtime && (
                                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-white/10 backdrop-blur-md">
                                                <Clock size={12} className="text-amber-400 md:w-[14px] md:h-[14px]" />
                                                <span>{episode.runtime} Dakika</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 max-w-2xl">
                                        <h3 className="text-[10px] md:text-xs font-black text-amber-400 uppercase tracking-[0.2em] italic drop-shadow-lg">Bölüm Özeti</h3>
                                        <p className="text-neutral-200 text-sm md:text-xl leading-relaxed font-medium drop-shadow-md">
                                            {episode.overview || "Bu bölüm için henüz bir özet girilmemiş."}
                                        </p>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-4">
                                        <button
                                            disabled={isPending}
                                            onClick={onToggleWatch}
                                            className={cn(
                                                "flex items-center gap-2 md:gap-3 px-5 py-3 md:px-8 md:py-4 rounded-[1.5rem] font-black uppercase text-[10px] md:text-sm transition-all active:scale-95 shadow-xl backdrop-blur-sm",
                                                isWatched
                                                    ? "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20 border border-green-500/20"
                                                    : "bg-white text-slate-950 hover:bg-neutral-200"
                                            )}
                                        >
                                            <Eye size={16} className={cn("md:w-5 md:h-5", isWatched && "fill-current")} />
                                            {isWatched ? "İzlemeyi Kaldır" : "İzlendi İşaretle"}
                                        </button>

                                        <div className="flex items-center gap-1.5 md:gap-2 bg-black/40 p-1 md:p-1.5 rounded-[1.5rem] border border-white/10 shadow-xl backdrop-blur-md">
                                            <button
                                                onClick={() => onRate(1)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-2xl transition-all",
                                                    currentRating === 1
                                                        ? "bg-amber-400 text-slate-950"
                                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <ThumbsUp size={16} className={cn("md:w-[18px] md:h-[18px]", currentRating === 1 ? "fill-current" : "")} />
                                                <span className="font-black text-[10px] md:text-xs uppercase tracking-tighter">Harika</span>
                                            </button>
                                            <button
                                                onClick={() => onRate(0)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-2xl transition-all",
                                                    currentRating === 0
                                                        ? "bg-rose-500 text-white"
                                                        : "text-neutral-400 hover:text-rose-400 hover:bg-rose-500/5"
                                                )}
                                            >
                                                <ThumbsDown size={16} className={cn("md:w-[18px] md:h-[18px]", currentRating === 0 ? "fill-current" : "")} />
                                                <span className="font-black text-[10px] md:text-xs uppercase tracking-tighter">Kötü</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Comments App-like Feed */}
                        <div className="flex-1 md:w-2/5 bg-neutral-900 md:border-l border-white/5 flex flex-col min-h-0 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">
                                    Bölüm <span className="text-amber-400">Yorumları</span>
                                </h3>
                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-neutral-500 uppercase">
                                    {comments.length} Mesaj
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {comments.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 px-10">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                            <Send size={24} className="text-white" />
                                        </div>
                                        <p className="text-sm font-bold text-white uppercase tracking-[0.2em]">Henüz bir şey yazılmadı. İlk sen başla!</p>
                                    </div>
                                ) : (
                                    comments.map((c: any) => (
                                        <CommentItem key={c.id} comment={c} />
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSubmitComment} className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsSpoiler(!isSpoiler)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                                            isSpoiler
                                                ? "bg-rose-500/20 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/10"
                                                : "bg-white/5 border-white/10 text-neutral-500 hover:text-white"
                                        )}
                                    >
                                        <EyeOff size={14} />
                                        Spoiler İçeriyor
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Bu bölüm hakkında ne düşünüyorsun?"
                                            className="w-full bg-neutral-800 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-bold shadow-inner"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!commentText.trim() || isPending}
                                        className="bg-amber-400 text-slate-950 p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-amber-400/20 shrink-0"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
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
        <div className="group/comment space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-800 shrink-0 overflow-hidden ring-1 ring-white/10 shadow-lg transition-transform group-hover/comment:scale-110">
                    {comment.user?.image ? (
                        <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User size={16} className="text-neutral-500" />
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-[11px] font-black text-white leading-none truncate uppercase italic tracking-tight">
                            {comment.user?.name || "Kullanıcı"}
                        </p>
                        {comment.isSpoiler && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[7px] font-black uppercase tracking-tighter border border-rose-500/20">
                                <AlertTriangle size={8} /> SPOILER
                            </span>
                        )}
                    </div>
                    <p className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5">
                        {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                </div>
            </div>
            <div
                onClick={() => comment.isSpoiler && setIsRevealed(true)}
                className={cn(
                    "relative bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 transition-all overflow-hidden",
                    !isRevealed && "cursor-pointer hover:bg-white/10",
                    isRevealed ? "group-hover/comment:border-amber-400/20 group-hover/comment:bg-white/[0.08]" : "border-rose-500/20"
                )}
            >
                <p className={cn(
                    "text-xs text-neutral-300 font-medium leading-relaxed transition-all duration-500",
                    !isRevealed && "blur-md select-none opacity-40"
                )}>
                    {comment.content}
                </p>

                {comment.isSpoiler && !isRevealed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all group-hover:bg-black/10">
                        <div className="flex flex-col items-center gap-1">
                            <EyeOff size={16} className="text-rose-500 drop-shadow-lg" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest drop-shadow-md">Okumak için tıkla</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
