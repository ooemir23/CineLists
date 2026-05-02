"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Send, User, Users, EyeOff, Loader2, Share2, X, Download, Trash2, Edit3, Check, RotateCcw, Link2, Twitter, MessageCircle, ThumbsUp, ThumbsDown, Reply, CornerDownRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { addComment, deleteComment, updateComment, voteActivity, voteComment } from "@/lib/activity-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

type ReplyComment = {
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

type Comment = {
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

export function CommentsSection({
    mediaId,
    type,
    initialComments = [],
    mediaTitle,
    mediaPosterPath,
    currentUserId,
    director,
    producer
}: CommentsSectionProps) {
    const [newComment, setNewComment] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [shareComment, setShareComment] = useState<any>(null);
    const [editingComment, setEditingComment] = useState<Comment | ReplyComment | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editIsSpoiler, setEditIsSpoiler] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [mounted, setMounted] = useState(false);
    const [currentUserInfo, setCurrentUserInfo] = useState<{name: string, image: string | null} | null>(null);
    
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Find current user's info from existing comments if possible, or use defaults
        const ownComment = initialComments.find(c => c.userId === currentUserId);
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
                    router.refresh();
                }
            } catch (err) {
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
            else { setEditingComment(null); router.refresh(); }
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
            id: 'preview',
            content: newComment,
            user: {
                name: currentUserInfo?.name || "Kullanıcı",
                image: currentUserInfo?.image || null
            }
        });
    };

    const getShareUrl = () => `${window.location.href}#comments`;

    const getDynamicFontSize = (text: string) => {
        if (text.length > 250) return "text-[11px]";
        if (text.length > 150) return "text-[13px]";
        if (text.length > 80) return "text-[16px]";
        return "text-[21px]";
    };

    const CommentItem = ({ item, isReply = false }: { item: Comment | ReplyComment, isReply?: boolean }) => {
        const isOwn = currentUserId === item.userId;
        const isEditing = editingComment?.id === item.id;

        return (
            <div className={cn(
                "group/item transition-all p-5 rounded-3xl border border-white/5 hover:border-white/10 shadow-sm",
                isReply ? "bg-white/[0.01] ml-8 md:ml-12 border-l-2 border-l-amber-400/20" : "bg-white/[0.03]"
            )}>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-800 ring-1 ring-white/10 shadow-lg">
                        {item.user.image ? (
                            <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-white uppercase tracking-tight">{item.user.name || "Anonim"}</span>
                                <span className="text-[9px] font-bold text-neutral-600">
                                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                                </span>
                                {item.isSpoiler && !isEditing && (
                                    <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">Spoiler</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                {isOwn && !isEditing && (
                                    <>
                                        <button onClick={() => { setEditingComment(item); setEditContent(item.content); setEditIsSpoiler(!!item.isSpoiler); }} className="p-2 text-neutral-600 hover:text-sky-400 transition-colors"><Edit3 size={14} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-neutral-600 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                    </>
                                )}
                                {!isEditing && (
                                    <button onClick={() => setShareComment(item)} className="p-2 text-neutral-600 hover:text-amber-400 transition-colors"><Share2 size={14} /></button>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-amber-400/30 min-h-[100px] resize-none"
                                />
                                <div className="flex items-center justify-between">
                                    <button onClick={() => setEditIsSpoiler(!editIsSpoiler)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all", editIsSpoiler ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-white/5 border-white/10 text-neutral-500")}>
                                        <EyeOff size={12} /> {editIsSpoiler ? "SPOILER" : "SPOILER?"}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingComment(null)} className="px-4 py-2 rounded-xl bg-white/5 text-neutral-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Vazgeç</button>
                                        <button onClick={handleUpdate} disabled={isPending} className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-400/20">Kaydet</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={cn("text-[13px] leading-relaxed text-neutral-300 font-medium whitespace-pre-wrap break-words", item.isSpoiler && "blur-md select-none cursor-help hover:blur-none transition-all duration-500")}>
                                {item.content}
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
                                <button onClick={() => handleVote(item.id, !isReply, 1)} className="p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors"><ThumbsUp size={14} /></button>
                                <span className={cn("text-[10px] font-black min-w-[20px] text-center", (item.votes || 0) > 0 ? "text-emerald-400" : (item.votes || 0) < 0 ? "text-rose-500" : "text-neutral-500")}>{item.votes || 0}</span>
                                <button onClick={() => handleVote(item.id, !isReply, -1)} className="p-1.5 text-neutral-500 hover:text-rose-500 transition-colors"><ThumbsDown size={14} /></button>
                            </div>
                            
                            {!isReply && (
                                <button 
                                    onClick={() => { setReplyingTo(item as Comment); setNewComment(""); window.scrollTo({ top: document.getElementById('comment-form')?.offsetTop ? document.getElementById('comment-form')!.offsetTop - 100 : 0, behavior: 'smooth' }); }}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-neutral-500 hover:text-amber-400 transition-colors uppercase tracking-widest"
                                >
                                    <Reply size={14} /> Yanıtla
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
            {/* LEFT: Comments List */}
            <div className="space-y-6 order-2 lg:order-1">
                {initialComments.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
                        <MessageSquare className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                        <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">Henüz yorum yok. İlk tartışmayı sen başlat!</p>
                    </div>
                ) : (
                    initialComments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                            <CommentItem item={comment} />
                            {comment.replies?.map((reply) => (
                                <CommentItem key={reply.id} item={reply} isReply />
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* RIGHT: Comment Form (Sticky) */}
            <div id="comment-form" className="lg:sticky lg:top-24 space-y-6 order-1 lg:order-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Düşüncelerini Paylaş</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">İnteraktif yorum alanı</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
                            <MessageCircle size={24} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {replyingTo && (
                            <div className="flex items-center justify-between px-4 py-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                    <CornerDownRight size={14} /> {replyingTo.user.name}&apos;a yanıt veriliyor
                                </div>
                                <button type="button" onClick={() => setReplyingTo(null)} className="text-amber-400 hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                        )}

                        <div className="relative group">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyingTo ? "Yanıtını yaz..." : "Bu içerik hakkında ne düşünüyorsun?"}
                                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-base text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/30 min-h-[220px] resize-none transition-all shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setIsSpoiler(!isSpoiler)}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        isSpoiler ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-white/5 border-white/10 text-neutral-500 hover:text-white"
                                    )}
                                >
                                    <EyeOff size={14} /> {isSpoiler ? "SPOILER" : "SPOILER?"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePreviewShare}
                                    disabled={!newComment.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 disabled:opacity-30"
                                >
                                    <Share2 size={14} /> Görsel Paylaş
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={!newComment.trim() || isPending}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-amber-400 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all shadow-xl shadow-amber-400/20"
                            >
                                {isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Yorumu Yayınla
                            </button>
                        </div>
                    </form>
                </div>

                <div className="px-8 py-5 bg-gradient-to-r from-amber-400/5 to-transparent rounded-[2rem] border border-white/5 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center shrink-0 border border-amber-400/10">
                        <Sparkles size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-widest">Anında Hikaye Oluştur</p>
                        <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">Yorumunu yazarken "Görsel Paylaş" butonuna basarak anında paylaşılabilir bir kart oluşturabilirsin.</p>
                    </div>
                </div>
            </div>

            {/* SHARE MODAL */}
            {mounted && shareComment && createPortal(
                <div className="fixed inset-0 bg-black/98 backdrop-blur-[40px] animate-in fade-in duration-300 flex items-center justify-center" style={{ zIndex: 2147483647 }}>
                    <button onClick={() => setShareComment(null)} className="absolute top-6 right-6 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full z-[100002]" style={{ zIndex: 2147483647 }}><X size={24} /></button>
                    <div className="w-full max-w-[360px] flex flex-col items-center gap-6 max-h-[95vh] overflow-y-auto no-scrollbar py-8 px-0 md:px-4">
                        <div id="share-card" className="relative w-full aspect-[9/16] bg-[#070c16] overflow-hidden flex flex-col shadow-[0_40px_100px_rgba(0,0,0,1)]">
                            <div className="relative h-1/2 w-full overflow-hidden bg-slate-900">
                                {mediaPosterPath && <Image src={`https://image.tmdb.org/t/p/w1280${mediaPosterPath}`} alt={mediaTitle || ""} fill className="object-cover object-top" priority />}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070c16] via-transparent to-black/20" />
                                <div className="absolute top-6 left-6 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-white/20 shadow-2xl">
                                        {shareComment.user.image ? <img src={shareComment.user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/20"><User size={14} /></div>}
                                    </div>
                                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest drop-shadow-lg">{shareComment.user.name}</span>
                                </div>
                            </div>
                            <div className="relative h-1/2 w-full flex flex-col p-8 md:p-10 justify-center">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <h3 className="text-[26px] md:text-3xl font-black text-white uppercase italic tracking-tighter leading-[0.95] drop-shadow-lg">{mediaTitle}</h3>
                                        <div className="flex items-center gap-2"><div className="h-[1.5px] w-5 bg-amber-400" /><p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.4em]">CINELISTS</p></div>
                                    </div>
                                    <div className="max-h-[180px] overflow-hidden">
                                        <p className={cn("text-white font-medium leading-relaxed italic tracking-tight whitespace-pre-wrap", getDynamicFontSize(shareComment.content))}>&quot;{shareComment.content}&quot;</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-full flex flex-col items-center gap-6 px-6">
                            <div className="flex items-center gap-4">
                                <button onClick={() => { navigator.share?.({ title: mediaTitle, text: shareComment.content, url: getShareUrl() }); }} className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl transition-all"><Share2 size={24} /></button>
                                <button onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareComment.content)}&url=${encodeURIComponent(getShareUrl())}`, "_blank"); }} className="w-14 h-14 flex items-center justify-center bg-[#1DA1F2]/20 hover:bg-[#1DA1F2] text-[#1DA1F2] hover:text-white rounded-2xl transition-all"><Twitter size={24} /></button>
                                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareComment.content + "\n" + getShareUrl())}`, "_blank"); }} className="w-14 h-14 flex items-center justify-center bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-2xl transition-all"><MessageCircle size={24} /></button>
                                <button onClick={() => { navigator.clipboard.writeText(getShareUrl()); alert("Kopyalandı!"); }} className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl transition-all"><Link2 size={24} /></button>
                            </div>
                            <button onClick={() => alert("Yakında!")} className="w-full py-4 bg-amber-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02]"><Download size={18} className="inline-block mr-2" /> Görsel Olarak Kaydet</button>
                        </div>
                    </div>
                </div>, 
                document.body
            )}
        </div>
    );
}
