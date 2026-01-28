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
            const result = await saveWatchDetails({
                tmdbId,
                type,
                title,
                posterPath,
                rating: rating > 0 ? rating : undefined,
                watchedAt: new Date(watchedAt),
                watchedWith: selectedPeople.length > 0 ? selectedPeople : undefined,
                recommendedById: recommendedById || undefined,
                recommendedByText: recommendedByText || undefined,
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

    return (
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 w-full mt-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10 rounded-full -translate-x-1/2 translate-y-1/2" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Check className="text-green-500 w-5 h-5" />
                        İzleme Detayları
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-all hover:scale-110 active:scale-90"
                >
                    <X className="w-5 h-5 text-neutral-400" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pr-2">
                {/* Rating */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-yellow-500" /> Puanın
                    </label>
                    <div className="flex gap-1.5 bg-white/5 p-3 rounded-2xl border border-white/5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={cn(
                                    "transition-all hover:scale-125 active:scale-90",
                                    star <= rating ? "text-yellow-500" : "text-neutral-700"
                                )}
                            >
                                <Star
                                    className={cn(
                                        "w-6 h-6",
                                        star <= rating ? "fill-current" : ""
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> İzlenme Tarihi
                    </label>
                    <input
                        type="date"
                        value={watchedAt}
                        onChange={(e) => setWatchedAt(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/[0.08]"
                    />
                </div>

                {/* Watched With */}
                <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-400" /> Kiminle İzledin?
                    </label>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1 group">
                                <select
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
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
                                <Plus className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none group-hover:text-white transition-colors" />
                            </div>
                            <div className="relative flex-1 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Veya isim yaz..."
                                    value={customPerson}
                                    onChange={(e) => setCustomPerson(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addCustomPerson()}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/[0.08]"
                                />
                                <button
                                    onClick={addCustomPerson}
                                    className="px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl transition-all active:scale-95"
                                >
                                    <UserPlus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {selectedPeople.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedPeople.map(idOrName => {
                                    const friend = friends.find(f => f.id === idOrName);
                                    const isFriend = !!friend;
                                    return (
                                        <div
                                            key={idOrName}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all animate-in zoom-in-90",
                                                isFriend
                                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                    : "bg-neutral-800 text-neutral-300 border-white/5"
                                            )}
                                        >
                                            {isFriend ? friend.name : idOrName}
                                            <button
                                                onClick={() => setSelectedPeople(selectedPeople.filter(sid => sid !== idOrName))}
                                                className="hover:text-white transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommended By */}
                <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Kim Tavsiye Etti?
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1 group">
                            <select
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                value={recommendedById}
                                onChange={(e) => {
                                    setRecommendedById(e.target.value);
                                    if (e.target.value) setRecommendedByText("");
                                }}
                            >
                                <option value="" className="bg-neutral-900">Arkadaş Seç (Opsiyonel)</option>
                                {friends.map(friend => (
                                    <option key={friend.id} value={friend.id} className="bg-neutral-900">{friend.name}</option>
                                ))}
                            </select>
                            <Plus className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none group-hover:text-white transition-colors" />
                        </div>

                        <div className="relative flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Veya manuel isim yaz..."
                                value={recommendedByText}
                                onChange={(e) => {
                                    setRecommendedByText(e.target.value);
                                    if (e.target.value) setRecommendedById("");
                                }}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/[0.08]"
                            />
                            <button className="px-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl flex items-center justify-center transition-all hover:bg-primary/20 active:scale-90">
                                <UserPlus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Review / Comment */}
                <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-pink-400" /> İnceleme & Yorum
                    </label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Bu içerik hakkında ne düşünüyorsun? (Bu yorum aktivite akışında görünecektir)"
                        rows={4}
                        className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] px-6 py-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/[0.08] resize-none"
                    />
                </div>
            </div>

            <div className="mt-10 flex gap-4">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-[2] bg-white text-black font-black py-4 rounded-2xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Değişiklikleri Kaydet
                        </>
                    )}
                </button>
                <button
                    onClick={onClose}
                    disabled={isPending}
                    className="flex-1 bg-neutral-900 text-white font-bold rounded-2xl border border-white/5 hover:bg-neutral-800 transition-all active:scale-95 px-6"
                >
                    İptal
                </button>
            </div>
        </div>
    );
}
