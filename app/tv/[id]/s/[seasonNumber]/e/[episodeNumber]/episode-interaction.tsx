"use client";

import { useState, useTransition } from "react";
import { Eye, Check, ThumbsUp, ThumbsDown, Send, EyeOff, Loader2, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { markEpisodeAsWatched, removeEpisodeWatch, rateEpisode, ensureEpisodeExists } from "@/lib/tv-actions";
import { addEpisodeComment } from "@/lib/comment-actions";
import { useRouter } from "next/navigation";

interface EpisodeInteractionProps {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    initialIsWatched: boolean;
    initialRating: number | null | undefined;
    episodeName: string;
    overview: string;
    stillPath: string;
    airDate: string;
    totalLikes: number;
    isAuthenticated: boolean;
}

export function EpisodeInteraction({
    tmdbId,
    seasonNumber,
    episodeNumber,
    initialIsWatched,
    initialRating,
    episodeName,
    overview,
    stillPath,
    airDate,
    totalLikes: initialTotalLikes,
    isAuthenticated
}: EpisodeInteractionProps) {
    const [isWatched, setIsWatched] = useState(initialIsWatched);
    const [currentRating, setCurrentRating] = useState(initialRating);
    const [totalLikes, setTotalLikes] = useState(initialTotalLikes);
    const [commentText, setCommentText] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggleWatch = async () => {
        if (!isAuthenticated) return alert("Lütfen önce giriş yapın.");
        const newState = !isWatched;
        setIsWatched(newState);

        startTransition(async () => {
            try {
                if (newState) {
                    await markEpisodeAsWatched(tmdbId, seasonNumber, episodeNumber, episodeName, overview, stillPath, airDate);
                } else {
                    await removeEpisodeWatch(tmdbId, seasonNumber, episodeNumber);
                }
                router.refresh();
            } catch (err) {
                setIsWatched(!newState);
                alert("Bir hata oluştu.");
            }
        });
    };

    const handleRate = async (rating: number) => {
        if (!isAuthenticated) return alert("Lütfen önce giriş yapın.");
        const newRating = currentRating === rating ? null : rating;
        
        if (rating === 1) {
            if (currentRating === 1) setTotalLikes(prev => prev - 1);
            else setTotalLikes(prev => prev + 1);
        } else if (currentRating === 1) {
            setTotalLikes(prev => prev - 1);
        }
        
        setCurrentRating(newRating);

        startTransition(async () => {
            try {
                await rateEpisode({
                    tmdbId,
                    seasonNumber,
                    episodeNumber,
                    rating,
                    title: episodeName,
                    overview,
                    stillPath,
                    airDate
                });
                router.refresh();
            } catch (err) {
                alert("Puanlama sırasında bir hata oluştu.");
                router.refresh();
            }
        });
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return alert("Lütfen önce giriş yapın.");
        if (!commentText.trim() || isPending) return;

        const text = commentText;
        setCommentText("");

        startTransition(async () => {
            try {
                const dbEp = await ensureEpisodeExists({
                    tmdbId,
                    seasonNumber,
                    episodeNumber,
                    title: episodeName,
                    overview,
                    stillPath,
                    airDate
                });

                await addEpisodeComment(dbEp.id, text, window.location.pathname, isSpoiler);
                setIsSpoiler(false);
                router.refresh();
            } catch (err) {
                setCommentText(text);
                alert("Yorum eklenirken bir hata oluştu.");
            }
        });
    };

    return (
        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {/* TOP ROW: Quick Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleWatch}
                        disabled={isPending}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                            isWatched ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500 hover:text-white"
                        )}
                    >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : isWatched ? <Check size={12} strokeWidth={3} /> : <Eye size={12} />}
                        {isWatched ? "İzledim" : "İzlemedim"}
                    </button>
                    
                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                    
                    <button
                        onClick={() => handleRate(1)}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            currentRating === 1 ? "bg-amber-400/20 text-amber-400" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <ThumbsUp size={14} className={cn(currentRating === 1 && "fill-current")} />
                    </button>
                    <button
                        onClick={() => handleRate(0)}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            currentRating === 0 ? "bg-rose-500/20 text-rose-500" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <ThumbsDown size={14} className={cn(currentRating === 0 && "fill-current")} />
                    </button>
                    {totalLikes > 0 && <span className="text-[10px] font-black text-amber-400/40 ml-1">{totalLikes} Beğeni</span>}
                </div>

                <button
                    type="button"
                    onClick={() => setIsSpoiler(!isSpoiler)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                        isSpoiler ? "bg-rose-500/20 border-rose-500 text-rose-500" : "bg-white/5 border-white/5 text-slate-500 hover:text-white"
                    )}
                >
                    <EyeOff size={12} /> {isSpoiler ? "Spoiler Açık" : "Spoiler?"}
                </button>
            </div>

            {/* BOTTOM ROW: Message Input */}
            <form onSubmit={handleAddComment} className="relative flex items-center gap-2">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Mesaj gönder..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-all font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10 hover:text-amber-400 cursor-pointer transition-colors">
                        <Smile size={18} />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!commentText.trim() || isPending}
                    className="shrink-0 w-11 h-11 bg-amber-400 text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-amber-400/20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
