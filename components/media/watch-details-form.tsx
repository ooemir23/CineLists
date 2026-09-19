"use client";

import { useState, useEffect, useTransition } from "react";
import { Calendar, Users, Star, MessageSquare, Loader2, X, Check, Plus, RotateCcw, Sparkles } from "lucide-react";
import { getFriends } from "@/lib/social-actions";
import { saveWatchDetails } from "@/lib/activity-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Friend = {
    id: string;
    name: string | null;
    image: string | null;
};

type WatchDetailsFormProps = {
    tmdbId: number;
    type: "movie" | "tv";
    title: string;
    posterPath: string | null;
    initialRating?: number | null;
    initialRecommendation?: {
        id: string;
        name: string;
    } | null;
    isGuest?: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
};

const RATING_DESCRIPTIONS: Record<number, string> = {
    1: "Felaket",
    2: "Çok Kötü",
    3: "Kötü",
    4: "Vasat",
    5: "Ortalama",
    6: "Fena Değil",
    7: "İyi",
    8: "Çok İyi",
    9: "Harika",
    10: "Başyapıt",
};

export function WatchDetailsForm({
    tmdbId,
    type,
    title,
    posterPath,
    initialRating,
    initialRecommendation,
    isGuest,
    onClose,
    onSaveSuccess
}: WatchDetailsFormProps) {
    const [rating, setRating] = useState(initialRating || 0);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split("T")[0]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [review, setReview] = useState("");
    const [isPending, startTransition] = useTransition();
    const [customPerson, setCustomPerson] = useState("");
    const [selectedRecommenders, setSelectedRecommenders] = useState<string[]>(
        initialRecommendation ? [initialRecommendation.name] : []
    );
    const [customRecommender, setCustomRecommender] = useState("");

    useEffect(() => {
        async function loadFriends() {
            try {
                const data = await getFriends();
                setFriends(data);
            } catch (err) {
                console.error("Failed to load friends", err);
            }
        }
        loadFriends();
    }, []);

    const handleSave = () => {
        if (isGuest) {
            toast.error("Detayları kaydetmek için lütfen giriş yapın veya kayıt olun.");
            return;
        }
        startTransition(async () => {
            // Find first real friend ID for notifications
            const firstFriendName = selectedRecommenders[0];
            const firstFriend = friends.find(f => f.name === firstFriendName);

            let firstFriendId = firstFriend?.id;
            if (!firstFriendId && initialRecommendation && initialRecommendation.name === firstFriendName) {
                firstFriendId = initialRecommendation.id;
            }

            const result = await saveWatchDetails({
                tmdbId,
                type,
                title,
                posterPath,
                rating: rating > 0 ? rating : undefined,
                watchedAt: new Date(watchedAt),
                watchedWith: selectedPeople.length > 0 ? selectedPeople : undefined,
                recommendedById: firstFriendId || undefined,
                recommendedByText: selectedRecommenders.length > 0 ? JSON.stringify(selectedRecommenders) : undefined,
                review: review.trim() || undefined,
            });

            if (result.success) {
                toast.success("İzleme detayları kaydedildi");
                onSaveSuccess();
                onClose();
            } else {
                toast.error(result.error || "Detaylar kaydedilemedi");
            }
        });
    };

    const addCustomPerson = () => {
        if (customPerson.trim() && !selectedPeople.includes(customPerson.trim())) {
            setSelectedPeople([...selectedPeople, customPerson.trim()]);
            setCustomPerson("");
        }
    };

    const addCustomRecommender = () => {
        if (customRecommender.trim() && !selectedRecommenders.includes(customRecommender.trim())) {
            setSelectedRecommenders([...selectedRecommenders, customRecommender.trim()]);
            setCustomRecommender("");
        }
    };

    const activeRating = hoveredRating !== null ? hoveredRating : rating;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c111c]/95 p-4 sm:p-5 backdrop-blur-xl shadow-2xl shadow-black/60 w-full mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Top accent border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                            İzleme Detayları
                        </h3>
                        <p className="text-[11px] text-neutral-400 font-medium truncate max-w-[220px] sm:max-w-md">
                            {title}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-95"
                    aria-label="Kapat"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="mt-4 space-y-4">
                {/* Rating Section */}
                <div className="space-y-2 rounded-2xl bg-white/[0.02] border border-white/5 p-3 sm:p-3.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            Puanın
                        </span>

                        <div className="flex items-center gap-2">
                            {activeRating > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-black shadow-[0_0_12px_rgba(251,191,36,0.15)] animate-in fade-in">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    {activeRating} / 10 • {RATING_DESCRIPTIONS[activeRating]}
                                </span>
                            ) : (
                                <span className="text-xs text-neutral-500 font-medium">
                                    Puan seç (opsiyonel)
                                </span>
                            )}

                            {rating > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRating(0);
                                        setHoveredRating(null);
                                    }}
                                    className="p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all text-[11px]"
                                    title="Puanı sıfırla"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Star selector */}
                    <div className="flex items-center justify-between gap-0.5 sm:gap-1 p-1 rounded-xl bg-black/20 w-full overflow-x-auto no-scrollbar">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                            const isFilled = star <= activeRating;
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(null)}
                                    onClick={() => setRating(rating === star ? 0 : star)}
                                    className="p-1 sm:p-1.5 rounded-lg transition-transform hover:scale-125 active:scale-95 focus:outline-none flex-1 flex justify-center"
                                    aria-label={`${star} puan`}
                                >
                                    <Star
                                        className={cn(
                                            "w-5 h-5 sm:w-6 sm:h-6 transition-all duration-150",
                                            isFilled
                                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)] scale-105"
                                                : "fill-transparent text-neutral-700 hover:text-neutral-500"
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Meta Grid: Date, Watched With, Recommender */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Tarih
                        </label>
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={watchedAt}
                                    onChange={(e) => setWatchedAt(e.target.value)}
                                    className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setWatchedAt(new Date().toISOString().split("T")[0])}
                                className="h-[34px] px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white text-[11px] font-bold transition-all shrink-0 active:scale-95"
                                title="Bugünün tarihini seç"
                            >
                                Bugün
                            </button>
                        </div>
                    </div>

                    {/* Watched With */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Users className="w-3.5 h-3.5 text-blue-400" /> Kiminle?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Arkadaş veya isim..."
                                value={customPerson}
                                onChange={(e) => setCustomPerson(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && customPerson.trim()) {
                                        e.preventDefault();
                                        addCustomPerson();
                                    }
                                }}
                                className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all"
                            />
                            {customPerson.trim() && (
                                <button
                                    type="button"
                                    onClick={addCustomPerson}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {customPerson.trim() && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900/95 backdrop-blur-lg border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 max-h-48 overflow-y-auto">
                                    {friends
                                        .filter(f => f.name?.toLowerCase().includes(customPerson.toLowerCase()) && !selectedPeople.includes(f.name || ""))
                                        .map(friend => (
                                            <button
                                                key={friend.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPeople([...selectedPeople, friend.name || ""]);
                                                    setCustomPerson("");
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs font-bold text-white hover:bg-blue-500/20 transition-colors flex items-center gap-2 border-b border-white/5"
                                            >
                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                    <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                {friend.name}
                                                <span className="ml-auto text-[9px] text-blue-400 uppercase font-semibold">Arkadaş</span>
                                            </button>
                                        ))
                                    }
                                    <button
                                        type="button"
                                        onClick={addCustomPerson}
                                        className="w-full px-3 py-2.5 text-left text-xs font-black text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        "{customPerson}" Ekle
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedPeople.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                                {selectedPeople.map(idOrName => {
                                    const friend = friends.find(f => f.id === idOrName || f.name === idOrName);
                                    const isFriend = !!friend;
                                    return (
                                        <span
                                            key={idOrName}
                                            className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all animate-in zoom-in-95",
                                                isFriend
                                                    ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                                    : "bg-white/5 text-neutral-300 border-white/10"
                                            )}
                                        >
                                            {isFriend ? friend.name : idOrName}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPeople(selectedPeople.filter(sid => sid !== idOrName))}
                                                className="hover:text-white transition-colors ml-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recommended By */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Tavsiye Eden?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Arkadaş veya isim..."
                                value={customRecommender}
                                onChange={(e) => setCustomRecommender(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && customRecommender.trim()) {
                                        e.preventDefault();
                                        addCustomRecommender();
                                    }
                                }}
                                className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all"
                            />
                            {customRecommender.trim() && (
                                <button
                                    type="button"
                                    onClick={addCustomRecommender}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {customRecommender.trim() && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900/95 backdrop-blur-lg border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 max-h-48 overflow-y-auto">
                                    {friends
                                        .filter(f => f.name?.toLowerCase().includes(customRecommender.toLowerCase()) && !selectedRecommenders.includes(f.name || ""))
                                        .map(friend => (
                                            <button
                                                key={friend.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRecommenders([...selectedRecommenders, friend.name || ""]);
                                                    setCustomRecommender("");
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs font-bold text-white hover:bg-purple-500/20 transition-colors flex items-center gap-2 border-b border-white/5"
                                            >
                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                    <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                {friend.name}
                                                <span className="ml-auto text-[9px] text-purple-400 uppercase font-semibold">Arkadaş</span>
                                            </button>
                                        ))
                                    }
                                    <button
                                        type="button"
                                        onClick={addCustomRecommender}
                                        className="w-full px-3 py-2.5 text-left text-xs font-black text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        "{customRecommender}" Ekle
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedRecommenders.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                                {selectedRecommenders.map(name => {
                                    const isFriend = friends.some(f => f.name === name);
                                    return (
                                        <span
                                            key={name}
                                            className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all animate-in zoom-in-95",
                                                isFriend
                                                    ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                                    : "bg-white/5 text-neutral-300 border-white/10"
                                            )}
                                        >
                                            {name}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRecommenders(selectedRecommenders.filter(r => r !== name))}
                                                className="hover:text-white transition-colors ml-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Textarea */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Yorum & Düşüncelerin
                    </label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Bu yapım hakkında ne düşündün? (Opsiyonel)"
                        rows={2}
                        className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all resize-none"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 h-10 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                        <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            Detayları Kaydet
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="h-10 px-5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-bold rounded-xl border border-white/10 active:scale-[0.98] transition-all text-xs"
                >
                    Kapat
                </button>
            </div>
        </div>
    );
}
