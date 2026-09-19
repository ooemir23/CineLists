"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Flame,
  Film,
  Compass,
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
  currentUser,
}: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<"forYou" | "friends" | "yours">("forYou");

  const filteredActivities = useMemo(() => {
    if (activeTab === "yours") {
      return initialActivities.filter((a) => a.userId === sessionUserId);
    }
    if (activeTab === "friends") {
      return initialActivities.filter((a) => a.userId !== sessionUserId);
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

  const userInitial = (currentUser?.name || "U").substring(0, 1).toUpperCase();

  return (
    <div className="w-full min-h-screen font-hanken pb-20 pt-2 sm:pt-4">
      <div className="max-w-[880px] mx-auto px-2 sm:px-4">
        
        {/* ═════════ INSTAGRAM 2-COLUMN BALANCED LAYOUT ═════════ */}
        <div className="flex justify-center items-start gap-8">
          
          {/* ───── MAIN FEED STREAM (Instagram standard width ~470px) ───── */}
          <main className="w-full max-w-[470px] space-y-4 shrink-0 min-w-0">
            
            {/* Feed Filter Tabs */}
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-md backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("forYou")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center",
                  activeTab === "forYou"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                Senin İçin
              </button>

              <button
                onClick={() => setActiveTab("friends")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5",
                  activeTab === "friends"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Takip Edilenler</span>
                {followingCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/10">
                    {followingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("yours")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center",
                  activeTab === "yours"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                Paylaşımların
              </button>
            </div>

            {/* ─── ACTIVITY POSTS LIST (Instagram Feed Stream) ─── */}
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-8 text-center shadow-xl space-y-4">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
                    <Film className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {activeTab === "yours"
                        ? "Henüz bir paylaşımın yok"
                        : "Henüz yeni bir akış paylaşımı yok"}
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                      {activeTab === "yours"
                        ? "İzlediğin filmleri puanlayarak ve yorum yazarak arkadaşlarınla paylaşmaya başla!"
                        : "Arkadaşlarını takip ederek onların izlediği ve yorumladığı filmleri burada görebilirsin."}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all active:scale-95"
                    >
                      <Compass className="w-4 h-4" />
                      Filmleri Keşfet
                    </Link>
                  </div>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <ActivityPost key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </main>

          {/* ───── RIGHT SIDEBAR (Instagram sidebar width ~320px) ───── */}
          <aside className="hidden lg:flex flex-col w-[320px] shrink-0 space-y-4 sticky top-20 select-none">
            
            {/* 1. Logged-in User Card */}
            {currentUser && (
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <Link href="/profile" className="flex items-center gap-3 min-w-0 group">
                    <div className="w-11 h-11 rounded-full overflow-hidden relative bg-slate-950 border border-white/10 group-hover:ring-2 group-hover:ring-amber-400 transition-all shrink-0">
                      {currentUser.image ? (
                        <Image
                          src={currentUser.image}
                          alt={currentUser.name || "Profil"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center font-black text-sm text-white"
                          style={{ background: getAvatarGradient(currentUser.name || "U") }}
                        >
                          {userInitial}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-amber-400 transition-colors">
                        {currentUser.username || currentUser.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {currentUser.name || "Sinefil"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/profile"
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors shrink-0"
                  >
                    Profili Gör
                  </Link>
                </div>

                {/* Mini Stats Row */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
                  <Link href="/watched" className="hover:bg-white/5 p-1 rounded-xl transition-colors">
                    <strong className="block text-xs font-black text-white">
                      {currentUser._count?.watched || 0}
                    </strong>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                      İzlenen
                    </span>
                  </Link>

                  <Link href="/watchlist" className="hover:bg-white/5 p-1 rounded-xl transition-colors">
                    <strong className="block text-xs font-black text-white">
                      {currentUser._count?.toWatch || 0}
                    </strong>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                      İzlenecek
                    </span>
                  </Link>

                  <Link href="/profile" className="hover:bg-white/5 p-1 rounded-xl transition-colors">
                    <strong className="block text-xs font-black text-white">
                      {currentUser._count?.followedBy || 0}
                    </strong>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                      Takipçi
                    </span>
                  </Link>
                </div>
              </div>
            )}

            {/* 2. Suggested Users */}
            {suggestedUsers.length > 0 && (
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                    Senin İçin Önerilenler
                  </h3>
                  <Link
                    href="/community"
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Tümü
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {suggestedUsers.slice(0, 4).map((user) => {
                    const initial = (user.name || user.username || "U").substring(0, 1).toUpperCase();
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-2.5"
                      >
                        <Link
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-2.5 min-w-0 group"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden relative bg-slate-950 shrink-0 border border-white/10 group-hover:ring-1 group-hover:ring-amber-400 transition-all">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || user.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center font-bold text-[11px] text-white"
                                style={{ background: getAvatarGradient(user.name || user.username) }}
                              >
                                {initial}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors leading-tight">
                              {user.username || user.name}
                            </h5>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {user._count?.watched ? `${user._count.watched} izleme` : "Topluluk üyesi"}
                            </span>
                          </div>
                        </Link>

                        <div className="shrink-0">
                          <FollowButton
                            targetUserId={user.id}
                            initialIsFollowing={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Trending Reviews */}
            {trendingReviews.length > 0 && (
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-rose-400" />
                    Öne Çıkan İncelemeler
                  </h3>
                </div>

                <div className="space-y-2">
                  {trendingReviews.slice(0, 3).map((review) => (
                    <Link
                      key={review.id}
                      href={`/${review.media.type.toLowerCase()}/${review.media.tmdbId}`}
                      className="block p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all group"
                    >
                      <div className="flex gap-2 items-center mb-1">
                        <div className="relative w-7 aspect-[2/3] rounded overflow-hidden bg-neutral-900 shrink-0">
                          {review.media.posterPath && (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${review.media.posterPath}`}
                              alt={review.media.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h6 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                            {review.media.title}
                          </h6>
                          <span className="text-[9px] text-neutral-400 truncate block">
                            {review.user?.name || review.user?.username}
                          </span>
                        </div>
                        {review.rating && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 shrink-0">
                            ★ {review.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {review.review && (
                        <p className="text-[10px] text-neutral-300 line-clamp-2 italic font-normal">
                          "{review.review}"
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Footer Links */}
            <footer className="px-2 text-[10px] text-neutral-500 space-y-1.5">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href="/privacy" className="hover:underline">Gizlilik</Link>
                <span>•</span>
                <Link href="/community" className="hover:underline">Topluluk</Link>
                <span>•</span>
                <Link href="/search" className="hover:underline">Keşfet</Link>
                <span>•</span>
                <Link href="/calendar" className="hover:underline">Takvim</Link>
              </div>
              <p className="text-[9px] text-neutral-600 font-medium">
                © 2026 CINELISTS • SİNEMA & DİZİ KULÜBÜ
              </p>
            </footer>

          </aside>
        </div>
      </div>
    </div>
  );
}
