"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Sparkles,
    Search,
    Users,
    Star,
    Flame,
    UserPlus,
    Film,
    Tv,
    TrendingUp,
    Quote,
    Bookmark,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityPost } from "./activity-post";
import { FollowButton } from "@/components/social/follow-button";

interface UserItem {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    _count?: {
        watched: number;
        followedBy: number;
    };
}

interface TrendingReview {
    id: string;
    review: string | null;
    rating: number | null;
    user: {
        id: string;
        name: string | null;
        username: string;
        image: string | null;
    };
    media: {
        tmdbId: number;
        title: string;
        posterPath: string | null;
        type: "MOVIE" | "TV" | "PERSON";
    };
}

interface CurrentUserStats {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    _count: {
        watched: number;
        toWatch: number;
        following: number;
        followedBy: number;
    };
}

interface FeedClientProps {
    initialActivities: any[];
    sessionUserId: string;
    followingCount: number;
    suggestedUsers?: UserItem[];
    trendingReviews?: TrendingReview[];
    currentUser?: CurrentUserStats | null;
}

export function FeedClient({
    initialActivities,
    sessionUserId,
    followingCount,
    suggestedUsers = [],
    trendingReviews = [],
    currentUser
}: FeedClientProps) {
    const [activeTab, setActiveTab] = useState<"friends" | "yours">("friends");

    const filteredActivities = useMemo(() => {
        if (activeTab === "yours") {
            return initialActivities.filter(a => a.userId === sessionUserId);
        }
        return initialActivities;
    }, [activeTab, initialActivities, sessionUserId]);

    const getAvatarGradient = (name: string) => {
        const gradients = [
            "linear-gradient(135deg,#f472b6,#be185d)",
            "linear-gradient(135deg,#38bdf8,#1d4ed8)",
            "linear-gradient(135deg,#34d399,#047857)",
            "linear-gradient(135deg,#fbbf24,#b45309)",
            "linear-gradient(135deg,#a78bfa,#6d28d9)",
        ];
        let sum = 0;
        const displayName = name || "User";
        for (let i = 0; i < displayName.length; i++) sum += displayName.charCodeAt(i);
        return gradients[sum % gradients.length];
    };

    const hasSidebar = Boolean(currentUser || suggestedUsers.length > 0 || trendingReviews.length > 0);

    return (
        <div className="w-full min-h-screen bg-background font-hanken text-foreground pb-24 md:pb-12">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 pt-3 sm:pt-6">
                
                {/* ═════════ 2-COLUMN RESPONSIVE LAYOUT ═════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ───── LEFT: MAIN ACTIVITY FEED (8 cols) ───── */}
                    <div className={cn("space-y-4", hasSidebar ? "lg:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto")}>
                        
                        {/* Header Banner */}
                        <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3.5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shadow-lg shadow-amber-400/5">
                                        <Sparkles className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h1 className="font-bricolage font-extrabold text-xl sm:text-2xl leading-tight text-white tracking-tight">
                                            Sosyal Akış
                                        </h1>
                                        <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            Arkadaşların ve topluluk ne izliyor?
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href="/community"
                                    className="h-9 px-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-md"
                                >
                                    <Search size={14} className="text-amber-400" />
                                    <span>Arkadaş Bul</span>
                                </Link>
                            </div>

                            {/* Tab Switcher */}
                            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setActiveTab("friends")}
                                    className={cn(
                                        "flex-1 text-center py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        activeTab === "friends"
                                            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                                            : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    Arkadaşların ({initialActivities.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("yours")}
                                    className={cn(
                                        "flex-1 text-center py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        activeTab === "yours"
                                            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                                            : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    Senin Paylaşımların
                                </button>
                            </div>
                        </div>

                        {/* Feed Activities */}
                        <div className="flex flex-col gap-3.5 pb-6">
                            {filteredActivities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-[#0b1120] rounded-3xl border border-white/5 text-center px-6 shadow-xl">
                                    <div className="p-4 bg-amber-400/10 rounded-full mb-4 border border-amber-400/20">
                                        <Users className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <h2 className="font-bricolage font-bold text-lg text-white mb-1">
                                        {activeTab === "yours" ? "Henüz Bir Paylaşımın Yok" : "Akışında Henüz İçerik Yok"}
                                    </h2>
                                    <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto leading-relaxed">
                                        {activeTab === "yours"
                                            ? "Film ve dizi izledikçe veya inceleme yazdıkça burada listelenecek."
                                            : "Yeni içerikler ve incelemeler görmek için topluluktan sinemaseverleri takip et."}
                                    </p>
                                    <Link
                                        href="/community"
                                        className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 text-xs active:scale-95"
                                    >
                                        <Search size={15} />
                                        Sinemaseverleri Keşfet
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {filteredActivities.map((activity) => (
                                        <ActivityPost key={activity.id} activity={activity as any} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ───── RIGHT: DESKTOP SIDEBAR WIDGETS (4 cols) ───── */}
                    <div className="hidden lg:flex lg:col-span-4 flex-col gap-5 sticky top-20">
                        
                        {/* 1. Current User Mini Profile Card */}
                        {currentUser && (
                            <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                                <div className="flex items-center gap-3.5">
                                    <Link href="/profile" className="shrink-0 group">
                                        {currentUser.image ? (
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg relative group-hover:scale-105 transition-transform">
                                                <Image src={currentUser.image} alt={currentUser.name || "User"} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div 
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center font-bricolage font-bold text-lg text-white shadow-lg group-hover:scale-105 transition-transform"
                                                style={{ background: getAvatarGradient(currentUser.name || "") }}
                                            >
                                                {(currentUser.name || "U").substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </Link>
                                    <div className="min-w-0 flex-1">
                                        <Link href="/profile" className="font-bricolage font-bold text-base text-white hover:text-amber-400 transition-colors truncate block">
                                            {currentUser.name || "Sinemasever"}
                                        </Link>
                                        <div className="font-mono text-xs text-slate-400 truncate">
                                            @{currentUser.username}
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 text-center">
                                    <div>
                                        <div className="font-bricolage font-bold text-base text-white">
                                            {currentUser._count.watched}
                                        </div>
                                        <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            İzlenen
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bricolage font-bold text-base text-amber-400">
                                            {currentUser._count.toWatch}
                                        </div>
                                        <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Liste
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bricolage font-bold text-base text-white">
                                            {currentUser._count.followedBy}
                                        </div>
                                        <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Takipçi
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href="/profile"
                                        className="flex-1 py-2 text-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                                    >
                                        Profilim
                                    </Link>
                                    <Link
                                        href="/watchlist"
                                        className="py-2 px-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                                        title="İzleme Listesi"
                                    >
                                        <Bookmark size={14} />
                                        Listem
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 2. Suggested Cinephiles to Follow */}
                        {suggestedUsers.length > 0 && (
                            <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-5 shadow-xl space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-amber-400" />
                                        <h3 className="font-bricolage font-bold text-sm text-white tracking-tight uppercase">
                                            Önerilen Sinemaseverler
                                        </h3>
                                    </div>
                                    <Link
                                        href="/community"
                                        className="text-[11px] font-bold text-amber-400 hover:underline"
                                    >
                                        Tümü
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    {suggestedUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                            <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                                                {user.image ? (
                                                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 relative shrink-0">
                                                        <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bricolage font-bold text-xs text-white shrink-0"
                                                        style={{ background: getAvatarGradient(user.name || "") }}
                                                    >
                                                        {(user.name || "U").substring(0, 1).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                                        {user.name}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-slate-500 truncate">
                                                        {user._count?.watched || 0} izleme
                                                    </p>
                                                </div>
                                            </Link>

                                            <FollowButton
                                                targetUserId={user.id}
                                                initialIsFollowing={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Toplulukta Popüler / Trend İncelemeler */}
                        {trendingReviews.length > 0 && (
                            <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-5 shadow-xl space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-400" />
                                    <h3 className="font-bricolage font-bold text-sm text-white tracking-tight uppercase">
                                        Öne Çıkan İncelemeler
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {trendingReviews.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/${item.media?.type === "MOVIE" ? "movie" : "tv"}/${item.media?.tmdbId}`}
                                            className="block bg-white/[0.02] hover:bg-white/[0.05] p-3 rounded-2xl border border-white/5 hover:border-white/15 transition-all group"
                                        >
                                            <div className="flex gap-3 items-start">
                                                {item.media?.posterPath ? (
                                                    <div className="w-10 aspect-[2/3] rounded-lg overflow-hidden shrink-0 shadow-md relative bg-neutral-900">
                                                        <Image
                                                            src={`https://image.tmdb.org/t/p/w185${item.media.posterPath}`}
                                                            alt={item.media.title || "Film"}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 aspect-[2/3] rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 text-sm">
                                                        🎬
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                                            {item.media?.title}
                                                        </span>
                                                        {item.rating && (
                                                            <div className="flex items-center gap-0.5 bg-amber-400/10 px-1.5 py-0.5 rounded text-amber-400 shrink-0">
                                                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                                                <span className="font-mono text-[10px] font-bold">{item.rating}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        {item.user?.name}
                                                    </p>

                                                    {item.review && (
                                                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1.5 leading-snug italic">
                                                            "{item.review}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
