"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Search, Send, Loader2, Check, User as UserIcon, Instagram, Twitter, MessageCircle, Link as LinkIcon, Share2, UserPlus } from "lucide-react";
import { getFriends, searchUsers } from "@/lib/social-actions";
import { recommendMedia } from "@/lib/recommendation-actions";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Friend = {
    id: string;
    name: string | null;
    image: string | null;
};

type RecommendModalProps = {
    mediaId: number;
    title: string;
    type: "movie" | "tv";
    posterPath: string | null;
    onClose: () => void;
};

export function RecommendModal({ mediaId, title, type, posterPath, onClose }: RecommendModalProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${type}/${mediaId}` : "";
    const shareText = `CineLists'da ${title} içeriğine bakmalısın!`;

    useEffect(() => {
        async function loadInitial() {
            try {
                const data = await getFriends();
                setFriends(data);
            } catch (err) {
                console.error("Failed to load initial friends", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadInitial();
    }, []);

    // Global User Search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) return;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchUsers(searchQuery);
                setFriends(prev => {
                    const existingIds = new Set(prev.map(f => f.id));
                    const newUsers = results.filter(u => !existingIds.has(u.id));
                    return [...prev, ...newUsers];
                });
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSocialShare = (platform: string) => {
        const messagePart = message.trim() ? `\n\n"${message.trim()}"` : "";
        const finalText = `${shareText}${messagePart}`;

        let url = "";
        switch (platform) {
            case "whatsapp":
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalText + " " + shareUrl)}`;
                break;
            case "twitter":
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case "instagram":
                handleCopyLink();
                return;
            case "native":
                if (navigator.share) {
                    navigator.share({
                        title: title,
                        text: finalText,
                        url: shareUrl,
                    }).catch(console.error);
                    return;
                }
                break;
        }
        if (url) window.open(url, "_blank");
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const filteredFriends = friends.filter(f =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleFriendSelection = (id: string) => {
        setSelectedFriendIds(prev => 
            prev.includes(id) 
                ? prev.filter(fid => fid !== id) 
                : [...prev, id]
        );
    };

    const handleRecommend = () => {
        if (selectedFriendIds.length === 0) return;

        startTransition(async () => {
            // Send recommendations in parallel
            const promises = selectedFriendIds.map(id => 
                recommendMedia({
                    receiverId: id,
                    mediaId,
                    mediaType: type,
                    title,
                    posterPath,
                    message: message.trim() || undefined
                })
            );

            const results = await Promise.all(promises);
            const anySuccess = results.some(r => r.success);

            if (anySuccess) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 mt-16 md:mt-0">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-400/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Tavsiye Et</h2>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1 line-clamp-1">{title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="p-12 flex flex-col items-center text-center gap-4 animate-in zoom-in-90 duration-500">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <Check className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white">Tavsiyen Gönderildi!</h3>
                        <p className="text-neutral-400 font-medium">Arkadaşlarına bildirim gönderdik.</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Search */}
                        <div className="relative">
                            {isSearching ? (
                                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
                            ) : (
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            )}
                            <input
                                type="text"
                                placeholder="Arkadaş veya kullanıcı ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-all"
                            />
                        </div>

                        {/* Friends List */}
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Arkadaşlar Yükleniyor...</span>
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-neutral-500 text-sm font-medium">Sonuç bulunamadı.</p>
                                </div>
                            ) : (
                                filteredFriends.map((friend) => {
                                    const isSelected = selectedFriendIds.includes(friend.id);
                                    return (
                                        <button
                                            key={friend.id}
                                            onClick={() => toggleFriendSelection(friend.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98]",
                                                isSelected
                                                    ? "bg-amber-400/20 border-amber-400/40"
                                                    : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                                                {friend.image ? (
                                                    <Image src={friend.image} alt={friend.name || "User"} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                                        <UserIcon className="w-5 h-5 text-neutral-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-sm text-white truncate">{friend.name}</span>
                                            {isSelected && (
                                                <div className="ml-auto w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-slate-900" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Not Ekle (İsteğe Bağlı)</label>
                            <textarea
                                placeholder="Neden tavsiye ediyorsun?"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-400/40 resize-none hover:bg-white/[0.08] transition-all"
                            />
                        </div>

                        {/* Social Sharing Section */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Paylaş:</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleSocialShare("whatsapp")}
                                    className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all group"
                                    title="WhatsApp'ta Paylaş"
                                >
                                    <MessageCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleSocialShare("twitter")}
                                    className="w-10 h-10 flex items-center justify-center bg-sky-500/10 hover:bg-sky-500/20 rounded-xl border border-sky-500/20 transition-all group"
                                    title="Twitter'da Paylaş"
                                >
                                    <Twitter className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleSocialShare("instagram")}
                                    className="w-10 h-10 flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/20 rounded-xl border border-pink-500/20 transition-all group"
                                    title="Instagram'da Paylaş"
                                >
                                    <Instagram className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-xl border transition-all group",
                                        copySuccess
                                            ? "bg-amber-500/20 border-amber-500/40"
                                            : "bg-white/5 hover:bg-white/10 border-white/5"
                                    )}
                                    title="Bağlantıyı Kopyala"
                                >
                                    {copySuccess ? (
                                        <Check className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <LinkIcon className="w-5 h-5 text-neutral-400 group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                            <button
                                disabled={selectedFriendIds.length === 0 || isPending}
                                onClick={handleRecommend}
                                className="w-full py-4 bg-amber-400 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-400/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        {selectedFriendIds.length > 1 
                                            ? `${selectedFriendIds.length} Kişiye Tavsiye Gönder` 
                                            : "Arkadaşına Tavsiye Gönder"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
