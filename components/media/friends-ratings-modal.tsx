"use client";

import { X, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type FriendRating = {
    userId: string;
    userName: string | null;
    userImage: string | null;
    rating: number | null;
};

type FriendsRatingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    friendsRatings: FriendRating[];
    mediaTitle: string;
};

export function FriendsRatingsModal({ isOpen, onClose, friendsRatings, mediaTitle }: FriendsRatingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-black text-white">Arkadaşlarının Puanları</h2>
                        <p className="text-sm text-neutral-400 mt-1">{mediaTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {friendsRatings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Star className="w-8 h-8 text-neutral-600" />
                            </div>
                            <p className="text-neutral-400 font-medium">Henüz arkadaşlarından kimse puan vermemiş</p>
                            <p className="text-sm text-neutral-500 mt-2">İlk sen ol!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {friendsRatings.map((friend) => (
                                <Link
                                    key={friend.userId}
                                    href={`/profile/${friend.userId}`}
                                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                                >
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                                        {friend.userImage ? (
                                            <Image
                                                src={friend.userImage}
                                                alt={friend.userName || "User"}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-neutral-600" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                                            {friend.userName || "Anonim"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-black text-yellow-400">
                                            {friend.rating?.toFixed(1) || "0.0"}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
