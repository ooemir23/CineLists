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
    onClose: () => void;
    onSaveSuccess: () => void;
};

export function WatchDetailsForm({
    tmdbId,
    type,
    title,
    posterPath,
    initialRating,
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
    const [selectedRecommenders, setSelectedRecommenders] = useState<string[]>([]);
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
        startTransition(async () => {
            // Find first real friend ID for notifications
            const firstFriend = selectedRecommenders.find(r => friends.find(f => f.name === r));
            const firstFriendId = firstFriend ? friends.find(f => f.name === firstFriend)?.id : undefined;

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
                <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-blue-400" /> Kiminle?
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <select
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                                value={""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const friend = friends.find(f => f.id === val);
                                    const nameToTrack = friend?.name || val;
                                    if (val && !selectedPeople.includes(nameToTrack)) {
                                        setSelectedPeople([...selectedPeople, nameToTrack]);
                                    }
                                }}
                            >
                                <option value="" disabled className="bg-neutral-900">Arkadaş seç...</option>
                                {friends.filter(f => !selectedPeople.includes(f.name || "")).map(friend => (
                                    <option key={friend.id} value={friend.id} className="bg-neutral-900">{friend.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Veya isim..."
                                value={customPerson}
                                onChange={(e) => setCustomPerson(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCustomPerson()}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                            <button
                                onClick={addCustomPerson}
                                type="button"
                                className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {selectedPeople.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedPeople.map(idOrName => {
                                const friend = friends.find(f => f.id === idOrName);
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
                <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-purple-400" /> Tavsiye Eden?
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <select
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
                                value={""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const friend = friends.find(f => f.id === val);
                                    const nameToTrack = friend?.name || val;
                                    if (val && !selectedRecommenders.includes(nameToTrack)) {
                                        setSelectedRecommenders([...selectedRecommenders, nameToTrack]);
                                    }
                                }}
                            >
                                <option value="" disabled className="bg-neutral-900">Arkadaş seç...</option>
                                {friends.filter(f => !selectedRecommenders.includes(f.name || "")).map(friend => (
                                    <option key={friend.id} value={friend.id} className="bg-neutral-900">{friend.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Veya isim..."
                                value={customRecommender}
                                onChange={(e) => setCustomRecommender(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCustomRecommender()}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                            <button
                                onClick={addCustomRecommender}
                                type="button"
                                className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        </div>
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
