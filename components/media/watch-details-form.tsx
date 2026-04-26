"use client";

import { useState, useEffect, useTransition } from "react";
import { Calendar, Users, Star, MessageSquare, Loader2, X, Check, Plus, UserPlus } from "lucide-react";
import { getFriends } from "@/lib/social-actions";
import { saveWatchDetails } from "@/lib/activity-actions";
import { cn } from "@/lib/utils";

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
    const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split("T")[0]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]); // Can be IDs or names
    const [recommendedById, setRecommendedById] = useState<string>("");
    const [recommendedByText, setRecommendedByText] = useState<string>("");
    const [review, setReview] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
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
            } finally {
                setIsLoadingFriends(false);
            }
        }
        loadFriends();
    }, []);

    const handleSave = () => {
        if (isGuest) {
            alert("Detayları kaydetmek için lütfen giriş yapın veya kayıt olun.");
            return;
        }
        startTransition(async () => {
            // Find first real friend ID for notifications
            const firstFriendName = selectedRecommenders[0];
            const firstFriend = friends.find(f => f.name === firstFriendName);

            // Priority:
            // 1. A friend from the list
            // 2. The initial recommendation sender
            // 3. Fallback to undefined
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
                onSaveSuccess();
                onClose();
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

    return (
        <div className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-5 w-full mt-3 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                    <Check className="text-primary w-4 h-4" />
                    Detaylar
                </h3>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/5 rounded-full transition-all text-neutral-500 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-1">
                {/* Rating */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-500" /> Puanın
                    </label>
                    <div className="flex gap-1 bg-white/5 p-2 rounded-xl border border-white/5 w-fit">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={cn(
                                    "transition-all hover:scale-110",
                                    star <= rating ? "text-amber-500" : "text-neutral-700"
                                )}
                            >
                                <Star
                                    className={cn(
                                        "w-4 h-4",
                                        star <= rating ? "fill-current" : ""
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-primary" /> Tarih
                    </label>
                    <input
                        type="date"
                        value={watchedAt}
                        onChange={(e) => setWatchedAt(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                </div>

                {/* Watched With */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-blue-400" /> Kiminle?
                    </label>
                    <div className="relative group">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Arkadaş seç veya isim yaz..."
                                    value={customPerson}
                                    onChange={(e) => setCustomPerson(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && customPerson.trim()) {
                                            e.preventDefault();
                                            addCustomPerson();
                                        }
                                    }}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                />
                                {customPerson.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="max-h-48 overflow-y-auto">
                                            {/* Friends Match */}
                                            {friends
                                                .filter(f => f.name?.toLowerCase().includes(customPerson.toLowerCase()) && !selectedPeople.includes(f.name || ""))
                                                .map(friend => (
                                                    <button
                                                        key={friend.id}
                                                        onClick={() => {
                                                            setSelectedPeople([...selectedPeople, friend.name || ""]);
                                                            setCustomPerson("");
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-white hover:bg-primary/20 transition-colors flex items-center gap-2 border-b border-white/5"
                                                    >
                                                        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                            <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} className="w-full h-full object-cover" />
                                                        </div>
                                                        {friend.name}
                                                        <span className="ml-auto text-[8px] text-neutral-500 uppercase">Arkadaş</span>
                                                    </button>
                                                ))
                                            }
                                            {/* Custom Option */}
                                            <button
                                                onClick={addCustomPerson}
                                                className="w-full px-4 py-3 text-left text-xs font-black text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                "{customPerson}" Ekle
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {selectedPeople.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedPeople.map(idOrName => {
                                const friend = friends.find(f => f.id === idOrName || f.name === idOrName);
                                const isFriend = !!friend;
                                return (
                                    <div
                                        key={idOrName}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all animate-in zoom-in-95",
                                            isFriend
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                : "bg-neutral-800 text-neutral-400 border-white/5"
                                        )}
                                    >
                                        {isFriend ? friend.name : idOrName}
                                        <button
                                            onClick={() => setSelectedPeople(selectedPeople.filter(sid => sid !== idOrName))}
                                            className="hover:text-white transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recommended By */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-purple-400" /> Tavsiye Eden?
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Arkadaş seç veya isim yaz..."
                            value={customRecommender}
                            onChange={(e) => setCustomRecommender(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && customRecommender.trim()) {
                                    e.preventDefault();
                                    addCustomRecommender();
                                }
                            }}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                        />
                        {customRecommender.trim() && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="max-h-48 overflow-y-auto">
                                    {/* Friends Match */}
                                    {friends
                                        .filter(f => f.name?.toLowerCase().includes(customRecommender.toLowerCase()) && !selectedRecommenders.includes(f.name || ""))
                                        .map(friend => (
                                            <button
                                                key={friend.id}
                                                onClick={() => {
                                                    setSelectedRecommenders([...selectedRecommenders, friend.name || ""]);
                                                    setCustomRecommender("");
                                                }}
                                                className="w-full px-4 py-2 text-left text-xs font-bold text-white hover:bg-primary/20 transition-colors flex items-center gap-2 border-b border-white/5"
                                            >
                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                    <img src={friend.image || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} className="w-full h-full object-cover" />
                                                </div>
                                                {friend.name}
                                                <span className="ml-auto text-[8px] text-neutral-500 uppercase">Arkadaş</span>
                                            </button>
                                        ))
                                    }
                                    {/* Custom Option */}
                                    <button
                                        onClick={addCustomRecommender}
                                        className="w-full px-4 py-3 text-left text-xs font-black text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        "{customRecommender}" Ekle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedRecommenders.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedRecommenders.map(name => {
                                const isFriend = friends.some(f => f.name === name);
                                return (
                                    <div
                                        key={name}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all animate-in zoom-in-95",
                                            isFriend
                                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                : "bg-neutral-800 text-neutral-400 border-white/5"
                                        )}
                                    >
                                        {name}
                                        <button
                                            onClick={() => setSelectedRecommenders(selectedRecommenders.filter(r => r !== name))}
                                            className="hover:text-white transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Review */}
                <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-pink-400" /> Yorum
                    </label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Neler düşünüyorsun?"
                        rows={2}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none hover:bg-white/[0.08]"
                    />
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 bg-primary text-white font-black py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                            <Check className="w-4 h-4" />
                            Kaydet
                        </>
                    )}
                </button>
                <button
                    onClick={onClose}
                    disabled={isPending}
                    className="px-6 bg-neutral-800 text-neutral-400 font-bold rounded-xl border border-white/5 hover:bg-neutral-700 hover:text-white transition-all text-xs"
                >
                    İptal
                </button>
            </div>
        </div >
    );
}
