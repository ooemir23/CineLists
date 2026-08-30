"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
    MessageSquare, Send, User, EyeOff, Eye, Loader2, Share2, X, 
    Trash2, Edit3, Link2, Twitter, MessageCircle, 
    ThumbsUp, ThumbsDown, Reply, CornerDownRight, Sparkles,
    Clapperboard, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addComment, deleteComment, updateComment, voteActivity, voteComment } from "@/lib/activity-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type ReplyComment = {
    id: string;
    content: string;
    createdAt: Date;
    isSpoiler?: boolean;
    votes: number;
    userId?: string;
    user: {
        name: string | null;
        image: string | null;
    };
};

export type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    isSpoiler?: boolean;
    votes: number;
    userId?: string;
    user: {
        name: string | null;
        image: string | null;
    };
    replies: ReplyComment[];
};

type CommentsSectionProps = {
    mediaId: number;
    type: "movie" | "tv";
    initialComments?: Comment[];
    mediaTitle?: string;
    mediaPosterPath?: string | null;
    currentUserId?: string;
    director?: string;
    producer?: string;
};

const QUICK_TAGS = [
    "🏆 Başyapıt",
    "🔥 Sürükleyici",
    "🍿 Çerezlik",
    "🧠 Zihin Bükücü",
    "😢 Duygusal",
    "✨ Görsel Şölen",
    "👀 Mutlaka İzleyin"
];

export function CommentsSection({
    mediaId,
    type,
    initialComments = [],
    mediaTitle,
    mediaPosterPath,
    currentUserId,
}: CommentsSectionProps) {
    const [newComment, setNewComment] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [shareComment, setShareComment] = useState<any>(null);
    const [editingComment, setEditingComment] = useState<Comment | ReplyComment | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editIsSpoiler, setEditIsSpoiler] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [unblurredSpoilers, setUnblurredSpoilers] = useState<Record<string, boolean>>({});
    const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentUserInfo, setCurrentUserInfo] = useState<{ name: string; image: string | null } | null>(null);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const ownComment = initialComments.find((c) => c.userId === currentUserId);
        if (ownComment) {
            setCurrentUserInfo({ name: ownComment.user.name || "Kullanıcı", image: ownComment.user.image });
        } else {
            setCurrentUserInfo({ name: "Sen", image: null });
        }
    }, [initialComments, currentUserId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isPending) return;

        const content = newComment;
        const spoiler = isSpoiler;
        const parentId = replyingTo?.id;

        startTransition(async () => {
            try {
                const result = await addComment(
                    mediaId,
                    type,
                    content,
                    mediaTitle || "İçerik",
                    mediaPosterPath || null,
                    spoiler,
                    parentId
                );
                if (result.error) {
                    alert(result.error);
                } else {
                    setNewComment("");
                    setIsSpoiler(false);
                    setReplyingTo(null);
                    setIsInputFocused(false);
                    router.refresh();
                }
            } catch {
                alert("Bir hata oluştu.");
            }
        });
    };

    const handleVote = async (id: string, isActivity: boolean, increment: number) => {
        startTransition(async () => {
            if (isActivity) await voteActivity(id, increment);
            else await voteComment(id, increment);
            router.refresh();
        });
    };

    const handleUpdate = async () => {
        if (!editingComment || !editContent.trim() || isPending) return;
        startTransition(async () => {
            const result = await updateComment(editingComment.id, editContent, editIsSpoiler);
            if (result.error) alert(result.error);
            else {
                setEditingComment(null);
                router.refresh();
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
            const result = await deleteComment(id);
            if (result.error) alert(result.error);
            else router.refresh();
        });
    };

    const handlePreviewShare = () => {
        if (!newComment.trim()) return;
        setShareComment({
            id: "preview",
            content: newComment,
            user: {
                name: currentUserInfo?.name || "Kullanıcı",
                image: currentUserInfo?.image || null,
            },
        });
    };

    const toggleSpoilerReveal = (id: string) => {
        setUnblurredSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddTag = (tag: string) => {
        if (newComment.includes(tag)) return;
        setNewComment((prev) => (prev.trim() ? `${prev} ${tag}` : `${tag} `));
        setIsInputFocused(true);
    };

    const getShareUrl = () => `${window.location.href}#comments`;

    const getDynamicFontSize = (text: string) => {
        if (text.length > 250) return "text-[11px]";
        if (text.length > 150) return "text-[13px]";
        if (text.length > 80) return "text-[16px]";
        return "text-[21px]";
    };

    // Calculate total comment count including replies
    const totalCommentsCount = initialComments.reduce(
        (acc, c) => acc + 1 + (c.replies?.length || 0),
        0
    );

    // Sort comments
    const sortedComments = [...initialComments].sort((a, b) => {
        if (sortBy === "top") {
            return (b.votes || 0) - (a.votes || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const CommentCard = ({ item, isReply = false }: { item: Comment | ReplyComment; isReply?: boolean }) => {
        const isOwn = currentUserId === item.userId;
        const isEditing = editingComment?.id === item.id;
        const isRevealed = unblurredSpoilers[item.id];
        const isSpoilerHidden = item.isSpoiler && !isRevealed && !isEditing;

        return (
            <div
                className={cn(
                    "group/card transition-all p-3.5 sm:p-5 rounded-2xl border backdrop-blur-md shadow-sm",
                    isReply
                        ? "bg-white/[0.02] border-white/5 ml-4 sm:ml-10 border-l-2 border-l-amber-400/40"
                        : "bg-white/[0.03] border-white/10 hover:border-white/15"
                )}
            >
                <div className="flex gap-3 sm:gap-4 items-start">
                    {/* User Avatar */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-neutral-800 ring-1 ring-white/10 shadow-md">
                        {item.user.image ? (
                            <img src={item.user.image} alt={item.user.name || ""} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                <User size={18} />
                            </div>
                        )}
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Header: User, Date, Badges & Menu */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                                    {item.user.name || "Anonim"}
                                </span>
                                <span className="text-[10px] sm:text-xs font-medium text-neutral-500">
                                    {new Date(item.createdAt).toLocaleDateString("tr-TR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                                {item.isSpoiler && (
                                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-widest">
                                        <EyeOff size={10} /> Spoiler
                                    </span>
                                )}
                            </div>

                            {/* Actions Dropdown / Icons */}
                            <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity">
                                {isOwn && !isEditing && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingComment(item);
                                                setEditContent(item.content);
                                                setEditIsSpoiler(!!item.isSpoiler);
                                            }}
                                            className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-white/5 active:scale-95 transition-all"
                                            title="Düzenle"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-white/5 active:scale-95 transition-all"
                                            title="Sil"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                                {!isEditing && (
                                    <button
                                        onClick={() => setShareComment(item)}
                                        className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-white/5 active:scale-95 transition-all"
                                        title="Hikaye Olarak Paylaş"
                                    >
                                        <Share2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Comment Text / Edit Box */}
                        {isEditing ? (
                            <div className="space-y-2 pt-1">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/40 min-h-[85px] resize-none"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setEditIsSpoiler(!editIsSpoiler)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                                            editIsSpoiler
                                                ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                                : "bg-white/5 border-white/10 text-neutral-400"
                                        )}
                                    >
                                        <EyeOff size={12} /> {editIsSpoiler ? "Spoiler" : "Spoiler?"}
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setEditingComment(null)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-neutral-400 text-[10px] font-black uppercase tracking-wider hover:text-white transition-colors"
                                        >
                                            Vazgeç
                                        </button>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={isPending}
                                            className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-400/20"
                                        >
                                            Kaydet
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                {isSpoilerHidden ? (
                                    <div
                                        onClick={() => toggleSpoilerReveal(item.id)}
                                        className="relative cursor-pointer rounded-xl bg-rose-500/5 border border-rose-500/15 p-3 sm:p-4 text-center overflow-hidden group/spoiler hover:border-rose-500/30 transition-all"
                                    >
                                        <div className="blur-sm select-none opacity-25 text-xs text-white">
                                            {item.content}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 backdrop-blur-[2px]">
                                            <Eye size={14} className="text-rose-400 group-hover/spoiler:scale-110 transition-transform" />
                                            <span className="text-[10px] sm:text-xs font-black text-rose-300 uppercase tracking-wider">
                                                Spoiler içerir · Görmek için tıkla
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs sm:text-sm leading-relaxed text-neutral-200 font-normal whitespace-pre-wrap break-words">
                                        {item.content}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bottom Actions: Vote & Reply */}
                        <div className="flex items-center gap-4 pt-1">
                            {/* Vote Pill */}
                            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/5">
                                <button
                                    onClick={() => handleVote(item.id, !isReply, 1)}
                                    className="p-1 text-neutral-400 hover:text-emerald-400 active:scale-95 transition-colors"
                                    title="Beğen"
                                >
                                    <ThumbsUp size={13} />
                                </button>
                                <span
                                    className={cn(
                                        "text-[10px] sm:text-xs font-black min-w-[18px] text-center px-0.5",
                                        (item.votes || 0) > 0
                                            ? "text-emerald-400"
                                            : (item.votes || 0) < 0
                                            ? "text-rose-400"
                                            : "text-neutral-400"
                                    )}
                                >
                                    {item.votes || 0}
                                </span>
                                <button
                                    onClick={() => handleVote(item.id, !isReply, -1)}
                                    className="p-1 text-neutral-400 hover:text-rose-400 active:scale-95 transition-colors"
                                    title="Beğenme"
                                >
                                    <ThumbsDown size={13} />
                                </button>
                            </div>

                            {/* Reply Button */}
                            {!isReply && (
                                <button
                                    onClick={() => {
                                        setReplyingTo(item as Comment);
                                        setNewComment("");
                                        setIsInputFocused(true);
                                        document.getElementById("main-comment-input")?.focus();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors uppercase tracking-wider"
                                >
                                    <Reply size={13} /> Yanıtla
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* ═══ 1. TOP HEADER & SORT BAR ════════════════════════ */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/15">
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                            Yorumlar & İncelemeler
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-black border border-amber-400/20">
                                {totalCommentsCount}
                            </span>
                        </h2>
                    </div>
                </div>

                {/* Sort Toggle */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                    <button
                        onClick={() => setSortBy("newest")}
                        className={cn(
                            "px-2.5 sm:px-3 py-1 rounded-lg transition-all",
                            sortBy === "newest"
                                ? "bg-amber-400 text-slate-950 shadow-sm"
                                : "text-neutral-400 hover:text-white"
                        )}
                    >
                        En Yeni
                    </button>
                    <button
                        onClick={() => setSortBy("top")}
                        className={cn(
                            "px-2.5 sm:px-3 py-1 rounded-lg transition-all",
                            sortBy === "top"
                                ? "bg-amber-400 text-slate-950 shadow-sm"
                                : "text-neutral-400 hover:text-white"
                        )}
                    >
                        En Beğenilen
                    </button>
                </div>
            </div>

            {/* ═══ 2. INTERACTIVE MAIN COMMENT BOX (HERO STYLE) ═══ */}
            <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl transition-all">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Reply banner if replying */}
                    {replyingTo && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-xl animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-wider truncate">
                                <CornerDownRight size={13} /> {replyingTo.user.name}&apos;a yanıt yazılıyor
                            </div>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="text-amber-400 hover:text-white transition-colors ml-2"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 sm:gap-4 items-start">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-neutral-800 ring-1 ring-white/10 shadow-md">
                            {currentUserInfo?.image ? (
                                <img src={currentUserInfo.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                    <User size={18} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2.5">
                            <textarea
                                id="main-comment-input"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                placeholder={
                                    replyingTo
                                        ? "Yanıtınızı buraya yazın..."
                                        : "Bu film/dizi hakkında ne düşünüyorsunuz? Bir inceleme yazın..."
                                }
                                className={cn(
                                    "w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/40 resize-none transition-all shadow-inner",
                                    isInputFocused || newComment.length > 0
                                        ? "min-h-[90px] sm:min-h-[110px]"
                                        : "min-h-[48px] sm:min-h-[56px]"
                                )}
                            />

                            {/* Quick Tag Pills (Only when active or focused) */}
                            {(isInputFocused || newComment.length > 0) && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 animate-in fade-in duration-200">
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
                                        Hızlı Etiket:
                                    </span>
                                    {QUICK_TAGS.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleAddTag(tag)}
                                            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-amber-400/10 text-neutral-400 hover:text-amber-400 border border-white/5 hover:border-amber-400/20 text-[10px] font-bold transition-all active:scale-95"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expandable Footer Controls */}
                    {(isInputFocused || newComment.length > 0 || replyingTo) && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSpoiler(!isSpoiler)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border",
                                        isSpoiler
                                            ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                            : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                                    )}
                                >
                                    <EyeOff size={13} /> {isSpoiler ? "Spoiler" : "Spoiler?"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePreviewShare}
                                    disabled={!newComment.trim()}
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border border-white/10 disabled:opacity-30"
                                    title="Sosyal Medya Kartı Oluştur"
                                >
                                    <Sparkles size={13} className="text-amber-400" /> Görsel Paylaş
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {newComment.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewComment("");
                                            setIsSpoiler(false);
                                            setReplyingTo(null);
                                            setIsInputFocused(false);
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Temizle
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isPending}
                                    className="h-9 sm:h-10 px-4 sm:px-5 flex items-center justify-center gap-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-500 active:scale-[0.98] disabled:opacity-40 transition-all shadow-md shadow-amber-400/20"
                                >
                                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    <span>Yayınla</span>
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* ═══ 3. COMMENTS FEED ════════════════════════════════ */}
            <div className="space-y-3">
                {sortedComments.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 px-4 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl sm:rounded-3xl border border-white/5 border-dashed">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/15 flex items-center justify-center mx-auto mb-3 text-amber-400">
                            <Clapperboard size={22} />
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mb-1">
                            Henüz yorum veya inceleme yapılmamış
                        </h3>
                        <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                            Bu yapım hakkındaki ilk izlenimlerini yukarıdaki alandan hemen paylaşabilirsin!
                        </p>
                    </div>
                ) : (
                    sortedComments.map((comment) => (
                        <div key={comment.id} className="space-y-2.5">
                            <CommentCard item={comment} />

                            {/* Threaded Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="space-y-2">
                                    {comment.replies.map((reply) => (
                                        <CommentCard key={reply.id} item={reply} isReply />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ═══ 4. STORY SHARE MODAL ═══════════════════════════ */}
            {mounted && shareComment && createPortal(
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-[30px] animate-in fade-in duration-300 flex items-center justify-center p-4"
                    style={{ zIndex: 2147483647 }}
                    onClick={() => setShareComment(null)}
                >
                    <div
                        className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-400" />
                                Hikaye Kartı Önizleme
                            </h3>
                            <button
                                onClick={() => setShareComment(null)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Card Preview */}
                        <div
                            id="share-card"
                            className="relative w-full aspect-[9/14] bg-[#070c16] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
                        >
                            <div className="relative h-1/2 w-full overflow-hidden bg-slate-900">
                                {mediaPosterPath && (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w780${mediaPosterPath}`}
                                        alt={mediaTitle || ""}
                                        fill
                                        className="object-cover object-top"
                                        priority
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070c16] via-transparent to-black/30" />
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg overflow-hidden ring-1 ring-white/20 shadow-md">
                                        {shareComment.user.image ? (
                                            <img src={shareComment.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/40">
                                                <User size={12} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-wider drop-shadow-md">
                                        {shareComment.user.name}
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-1/2 w-full flex flex-col p-5 justify-center">
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-base font-black text-white uppercase italic tracking-tight line-clamp-1">
                                            {mediaTitle}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="h-[1px] w-4 bg-amber-400" />
                                            <p className="text-[7px] font-black text-amber-400 uppercase tracking-widest">
                                                CINELISTS
                                            </p>
                                        </div>
                                    </div>
                                    <div className="max-h-[120px] overflow-hidden">
                                        <p
                                            className={cn(
                                                "text-neutral-200 font-medium leading-relaxed italic tracking-tight",
                                                getDynamicFontSize(shareComment.content)
                                            )}
                                        >
                                            &ldquo;{shareComment.content}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Share Icons */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => {
                                        navigator.share?.({
                                            title: mediaTitle,
                                            text: shareComment.content,
                                            url: getShareUrl(),
                                        });
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-black rounded-xl transition-all"
                                    title="Paylaş"
                                >
                                    <Share2 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        window.open(
                                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                                shareComment.content
                                            )}&url=${encodeURIComponent(getShareUrl())}`,
                                            "_blank"
                                        );
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-[#1DA1F2]/20 hover:bg-[#1DA1F2] text-[#1DA1F2] hover:text-white rounded-xl transition-all"
                                    title="Twitter / X"
                                >
                                    <Twitter size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        window.open(
                                            `https://wa.me/?text=${encodeURIComponent(
                                                shareComment.content + "\n" + getShareUrl()
                                            )}`,
                                            "_blank"
                                        );
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-xl transition-all"
                                    title="WhatsApp"
                                >
                                    <MessageCircle size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(getShareUrl());
                                        alert("Bağlantı kopyalandı!");
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-black rounded-xl transition-all"
                                    title="Bağlantıyı Kopyala"
                                >
                                    <Link2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
