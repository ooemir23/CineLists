"use client";

import { useState } from "react";
import { X, Calendar, Clock, ThumbsUp, ThumbsDown, Send, User, Check, Eye, Play } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type EpisodeDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    episode: any;
    isWatched: boolean;
    onToggleWatch: () => Promise<void>;
    onRate: (rating: number) => Promise<void>;
    onAddComment: (text: string) => Promise<void>;
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

    if (!episode) return null;

    const currentRating = episode.ratings?.[0]?.rating;

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isPending) return;
        await onAddComment(commentText);
        setCommentText("");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl max-h-[90vh] bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors border border-white/10 backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        {/* Left Side: Visuals & Info */}
                        <div className="md:w-3/5 overflow-y-auto custom-scrollbar">
                            <div className="relative aspect-video w-full">
                                {episode.still_path ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/original${episode.still_path}`}
                                        alt={episode.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold uppercase tracking-widest">
                                        Fotoğraf Yok
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />

                                <div className="absolute bottom-6 left-8 flex items-center gap-3">
                                    <div className="px-4 py-2 bg-amber-400 rounded-2xl text-slate-950 font-black text-sm uppercase italic shadow-xl">
                                        Bölüm {episode.episode_number}
                                    </div>
                                    {isWatched && (
                                        <div className="px-4 py-2 bg-green-500 rounded-2xl text-white font-black text-sm uppercase italic shadow-xl flex items-center gap-2">
                                            <Check size={16} /> İzlendi
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
                                        {episode.name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-4 text-neutral-400 text-sm font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                            <Calendar size={14} className="text-amber-400" />
                                            <span>{episode.air_date ? new Date(episode.air_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Bilinmiyor'}</span>
                                        </div>
                                        {episode.runtime && (
                                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                <Clock size={14} className="text-amber-400" />
                                                <span>{episode.runtime} Dakika</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] italic">Bölüm Özeti</h3>
                                    <p className="text-neutral-300 text-lg leading-relaxed font-medium">
                                        {episode.overview || "Bu bölüm için henüz bir özet girilmemiş."}
                                    </p>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex flex-wrap items-center gap-4 pt-4">
                                    <button
                                        disabled={isPending}
                                        onClick={onToggleWatch}
                                        className={cn(
                                            "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase text-sm transition-all active:scale-95 shadow-xl",
                                            isWatched
                                                ? "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20"
                                                : "bg-white text-slate-950 hover:bg-neutral-200"
                                        )}
                                    >
                                        <Eye size={20} className={cn(isWatched && "fill-current")} />
                                        {isWatched ? "İzlemeyi Kaldır" : "İzlendi İşaretle"}
                                    </button>

                                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 shadow-xl">
                                        <button
                                            onClick={() => onRate(1)}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all",
                                                currentRating === 1
                                                    ? "bg-amber-400 text-slate-950"
                                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <ThumbsUp size={18} className={currentRating === 1 ? "fill-current" : ""} />
                                            <span className="font-black text-xs uppercase tracking-tighter">Harika</span>
                                        </button>
                                        <button
                                            onClick={() => onRate(0)}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all",
                                                currentRating === 0
                                                    ? "bg-rose-500 text-white"
                                                    : "text-neutral-400 hover:text-rose-400 hover:bg-rose-500/5"
                                            )}
                                        >
                                            <ThumbsDown size={18} className={currentRating === 0 ? "fill-current" : ""} />
                                            <span className="font-black text-xs uppercase tracking-tighter">Kötü</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Comments App-like Feed */}
                        <div className="md:w-2/5 bg-neutral-900 border-l border-white/5 flex flex-col min-h-0">
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
                                        <div key={c.id} className="group/comment space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-neutral-800 shrink-0 overflow-hidden ring-1 ring-white/10 shadow-lg transition-transform group-hover/comment:scale-110">
                                                    {c.user?.image ? (
                                                        <img src={c.user.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={16} className="text-neutral-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-white leading-none truncate uppercase italic tracking-tight">{c.user?.name || "Kullanıcı"}</p>
                                                    <p className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 group-hover/comment:border-amber-400/20 group-hover/comment:bg-white/[0.08] transition-all">
                                                <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                                                    {c.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSubmitComment} className="p-6 bg-white/[0.02] border-t border-white/5">
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
                                        className="bg-amber-400 text-slate-950 p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-amber-400/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
