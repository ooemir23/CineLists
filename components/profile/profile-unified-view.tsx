"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Tv,
  Eye,
  Bookmark,
  Heart,
  Share2,
  Settings,
  Mail,
  Sparkles,
  Trophy,
  BarChart3,
  Star,
  Lock,
  Compass,
  Play,
  ArrowRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FollowButton } from "@/components/social/follow-button";
import { TasteMatchCard } from "./taste-match-card";
import { AchievementsBadges } from "./achievements-badges";
import { PeriodStats } from "./period-stats";
import { WatchCountries } from "./watch-countries";
import { FavoritePersons } from "./favorite-persons";
import { GenreTags } from "./genre-tags";
import { ManageFavoritesModal } from "./manage-favorites-modal";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export interface ProfileUserData {
  id: string;
  name: string | null;
  username: string;
  email?: string | null;
  image: string | null;
  bio: string | null;
  isPrivate: boolean;
  showActivities: boolean;
  showStats: boolean;
  favoriteGenres: string[];
  platforms: string[];
  createdAt?: Date | string | null;
  allGenres: { id: number; name: string }[];
  favoritePersons: any[];
  activities: any[];
  favoriteMediaIds?: string[];
  _count: {
    followedBy: number;
    following: number;
    toWatch: number;
    watched: number;
  };
}

export interface ProfileUnifiedViewProps {
  user: ProfileUserData;
  stats: { movieCount: number; showCount: number; episodeCount: number };
  watchedItems?: any[];
  watchlistItems?: any[];
  recentMediaItems?: any[];
  allGenres?: { id: number; name: string }[];
  thisMonthCount?: number;
  averageRating?: number;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  currentUserId?: string;
  coverBackdrops?: string[];
}

export function ProfileUnifiedView({
  user,
  stats,
  watchedItems = [],
  watchlistItems = [],
  recentMediaItems = [],
  allGenres = [],
  thisMonthCount = 0,
  averageRating = 0,
  isOwnProfile = false,
  isFollowing: initialIsFollowing = false,
  currentUserId,
  coverBackdrops = [],
}: ProfileUnifiedViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "watched" | "watchlist" | "badges" | "stats">("overview");
  const [watchedFilter, setWatchedFilter] = useState<"all" | "movie" | "tv">("all");
  const [watchedSort, setWatchedSort] = useState<"recent" | "rating">("recent");
  const [watchlistFilter, setWatchlistFilter] = useState<"all" | "movie" | "tv">("all");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isManageFavoritesOpen, setIsManageFavoritesOpen] = useState(false);
  const [localFavorites, setLocalFavorites] = useState<string[]>(user.favoriteMediaIds || []);

  // Avatar gradient fallback
  const getAvatarGradient = (name: string) => {
    const gradients = [
      "linear-gradient(135deg, #e11d48, #9333ea)",
      "linear-gradient(135deg, #0284c7, #2563eb)",
      "linear-gradient(135deg, #059669, #0d9488)",
      "linear-gradient(135deg, #d97706, #dc2626)",
      "linear-gradient(135deg, #7c3aed, #db2777)",
      "linear-gradient(135deg, #eab308, #ca8a04)",
    ];
    let sum = 0;
    const displayName = name || "User";
    for (let i = 0; i < displayName.length; i++) sum += displayName.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  const avatarGradient = getAvatarGradient(user.name || user.username || "");
  const initial = (user.name || user.username || "U").substring(0, 1).toUpperCase();

  // Find fallback backdrop from watched or watchlist media if coverBackdrops is empty
  const heroBackdrop = useMemo(() => {
    const ratedWithBackdrop = watchedItems
      .filter((w: any) => w.media?.backdropPath)
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));

    if (ratedWithBackdrop.length > 0 && ratedWithBackdrop[0]?.media?.backdropPath) {
      return `https://image.tmdb.org/t/p/w1280${ratedWithBackdrop[0].media.backdropPath}`;
    }

    const anyWatchedBackdrop = watchedItems.find((w: any) => w.media?.backdropPath);
    if (anyWatchedBackdrop?.media?.backdropPath) {
      return `https://image.tmdb.org/t/p/w1280${anyWatchedBackdrop.media.backdropPath}`;
    }

    const watchlistBackdrop = watchlistItems.find((w: any) => w.media?.backdropPath);
    if (watchlistBackdrop?.media?.backdropPath) {
      return `https://image.tmdb.org/t/p/w1280${watchlistBackdrop.media.backdropPath}`;
    }

    return null;
  }, [watchedItems, watchlistItems]);

  // Combine backdrops: user's favorite film covers take top priority
  const resolvedBackdrops = useMemo(() => {
    if (coverBackdrops && coverBackdrops.length > 0) {
      return coverBackdrops;
    }
    if (heroBackdrop) {
      return [heroBackdrop];
    }
    return [];
  }, [coverBackdrops, heroBackdrop]);

  // Top Spotlight Favorites (Letterboxd Style)
  const topFavorites = useMemo(() => {
    const favIds = (localFavorites || []).map(String);
    const explicitFavs: any[] = [];
    if (favIds.length > 0) {
      favIds.forEach((id) => {
        const item =
          watchedItems.find((w: any) => String(w.media?.tmdbId) === id) ||
          watchlistItems.find((w: any) => String(w.media?.tmdbId) === id);
        if (item) {
          explicitFavs.push({
            id: item.media.tmdbId,
            title: item.media.title,
            type: item.media.type?.toLowerCase() === "tv" ? "tv" : "movie",
            posterPath: item.media.posterPath,
            rating: item.rating || item.media.voteAverage,
            releaseYear: item.media.releaseDate ? new Date(item.media.releaseDate).getFullYear() : null,
          });
        }
      });
    }

    const rated = [...watchedItems]
      .filter((w: any) => w.rating != null && w.rating > 0 && !explicitFavs.some((f) => f.id === w.media.tmdbId))
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));

    const unrated = watchedItems.filter(
      (w: any) => !explicitFavs.some((f) => f.id === w.media.tmdbId) && !rated.some((r: any) => r.media.tmdbId === w.media.tmdbId)
    );

    const combined = [
      ...explicitFavs,
      ...rated.map((w: any) => ({
        id: w.media.tmdbId,
        title: w.media.title,
        type: w.media.type?.toLowerCase() === "tv" ? "tv" : "movie",
        posterPath: w.media.posterPath,
        rating: w.rating,
        releaseYear: w.media.releaseDate ? new Date(w.media.releaseDate).getFullYear() : null,
      })),
      ...unrated.map((w: any) => ({
        id: w.media.tmdbId,
        title: w.media.title,
        type: w.media.type?.toLowerCase() === "tv" ? "tv" : "movie",
        posterPath: w.media.posterPath,
        rating: w.rating || w.media.voteAverage,
        releaseYear: w.media.releaseDate ? new Date(w.media.releaseDate).getFullYear() : null,
      })),
    ];

    return combined.slice(0, explicitFavs.length > 4 ? 6 : 4);
  }, [watchedItems, watchlistItems, localFavorites]);

  // Dynamic Genre Stats based on watched history
  const genreBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    watchedItems.forEach((w: any) => {
      if (w.media?.genres && Array.isArray(w.media.genres)) {
        w.media.genres.forEach((g: string) => {
          counts[g] = (counts[g] || 0) + 1;
        });
      }
    });

    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    const total = list.reduce((sum, item) => sum + item.count, 0) || 1;

    return list
      .map(item => ({
        name: item.name,
        pct: Math.round((item.count / total) * 100),
        label: `${item.count} yapım`,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);
  }, [watchedItems]);

  // Currently watching items (status === WATCHING)
  const currentlyWatching = useMemo(() => {
    return watchlistItems.filter((item: any) => item.status === "WATCHING");
  }, [watchlistItems]);

  // Filtered & Sorted Watched items
  const displayedWatched = useMemo(() => {
    let list = [...watchedItems];
    if (watchedFilter !== "all") {
      list = list.filter((w: any) => {
        const t = w.media?.type?.toLowerCase();
        return watchedFilter === "tv" ? t === "tv" : t === "movie";
      });
    }

    if (watchedSort === "rating") {
      list.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else {
      list.sort((a: any, b: any) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
    }

    return list;
  }, [watchedItems, watchedFilter, watchedSort]);

  // Filtered Watchlist items
  const displayedWatchlist = useMemo(() => {
    let list = [...watchlistItems];
    if (watchlistFilter !== "all") {
      list = list.filter((w: any) => {
        const t = w.media?.type?.toLowerCase();
        return watchlistFilter === "tv" ? t === "tv" : t === "movie";
      });
    }
    return list;
  }, [watchlistItems, watchlistFilter]);

  // Share profile
  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${user.name || user.username} - CineLists`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profil bağlantısı panoya kopyalandı!");
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground pb-24">
      
      {/* ========================================================================= */}
      {/* FULL-WIDTH HERO BANNER & SUBTLE/SILIK FAVORITE FILM BACKDROPS */}
      {/* ========================================================================= */}
      <div className="relative h-36 sm:h-44 md:h-52 w-full overflow-hidden bg-slate-950">
        {resolvedBackdrops.length > 0 ? (
          <div className="absolute inset-0 flex items-stretch overflow-hidden">
            {resolvedBackdrops.slice(0, 4).map((url, i) => (
              <div key={i} className="relative flex-1 h-full min-w-0 overflow-hidden">
                <Image
                  src={url}
                  alt={`Cover ${i + 1}`}
                  fill
                  priority={i === 0}
                  className="object-cover object-center opacity-30 filter blur-[1.5px] brightness-90 scale-105 transition-all duration-1000"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
            {/* Silik, yumuşak sinematik degrade geçiş katmanları */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background/90" />
            <div className="absolute inset-0 bg-radial-to-c from-transparent via-black/20 to-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
          </div>
        )}

        {/* Top Action Bar (Over Banner, right aligned) */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-6 z-20 flex items-center gap-2">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => router.push("/settings/general")}
                className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/15 text-white flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 text-xs font-bold shadow-lg"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Profili Düzenle</span>
              </button>
              <button
                onClick={handleShare}
                aria-label="Profili Paylaş"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          ) : (
            <>
              {currentUserId && (
                <>
                  <FollowButton
                    targetUserId={user.id}
                    initialIsFollowing={isFollowing}
                    onFollowChange={setIsFollowing}
                  />
                  <Link
                    href={`/messages/${user.id}`}
                    className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold shadow-lg"
                  >
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Mesaj</span>
                  </Link>
                </>
              )}
              <button
                onClick={handleShare}
                aria-label="Profili Paylaş"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANSIVE MAIN CONTENT CONTAINER (NO SIDE BLACK DEAD SPACES) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* User Identity Header Overlapping Banner */}
        <div className="relative z-10 -mt-12 sm:-mt-16 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar + Name / Bio */}
            <div className="flex items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-[4px] border-background relative shadow-2xl bg-neutral-900 ring-2 ring-white/10">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.username}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-3xl sm:text-4xl text-white"
                      style={{ background: avatarGradient }}
                    >
                      {initial}
                    </div>
                  )}
                </div>
              </div>

              {/* Name / Handle / Badges */}
              <div className="min-w-0 pb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight truncate">
                    {user.name || user.username}
                  </h1>
                  {user.isPrivate && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-400 font-bold uppercase tracking-wider">
                      <Lock className="w-3 h-3" /> Gizli
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-mono text-neutral-400 mt-1 font-medium flex items-center gap-2">
                  <span>@{user.username}</span>
                  {user.createdAt && (
                    <>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-500 font-sans text-xs">
                        {new Date(user.createdAt).getFullYear()}&apos;den beri üye
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Biography */}
          {user.bio ? (
            <p className="text-sm sm:text-base text-neutral-300 mt-4 font-normal leading-relaxed max-w-3xl">
              {user.bio}
            </p>
          ) : (
            <p className="text-xs text-neutral-500 mt-3 italic">
              {isOwnProfile ? "Henüz bir biyografi eklemediniz. Ayarlardan kendinizi tanıtabilirsiniz." : "Henüz bir biyografi eklenmemiş."}
            </p>
          )}

          {/* Platform Badges */}
          {user.platforms && user.platforms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
              <span className="text-[10px] uppercase font-bold text-neutral-500 mr-1 tracking-wider">
                Platformlar:
              </span>
              {user.platforms.map((p) => (
                <span
                  key={p}
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 capitalize"
                >
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STATS RIBBON (FULL WIDTH 5-COLUMN GRID) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
            {/* Film */}
            <button
              onClick={() => {
                setActiveTab("watched");
                setWatchedFilter("movie");
              }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/30 rounded-2xl p-3.5 sm:p-4 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-blue-400 transition-colors">
                  Film
                </span>
                <Film className="w-4 h-4 text-blue-400/70 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="font-bold text-2xl text-white">
                {stats.movieCount}
              </div>
            </button>

            {/* Dizi */}
            <button
              onClick={() => {
                setActiveTab("watched");
                setWatchedFilter("tv");
              }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 rounded-2xl p-3.5 sm:p-4 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-purple-400 transition-colors">
                  Dizi
                </span>
                <Tv className="w-4 h-4 text-purple-400/70 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="font-bold text-2xl text-white">
                {stats.showCount}
              </div>
            </button>

            {/* Toplam İzlenen */}
            <button
              onClick={() => {
                setActiveTab("watched");
                setWatchedFilter("all");
              }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 rounded-2xl p-3.5 sm:p-4 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-amber-400 transition-colors">
                  İzlenen
                </span>
                <Eye className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="font-bold text-2xl text-white">
                {user._count.watched}
              </div>
            </button>

            {/* İzleme Listesi */}
            <button
              onClick={() => {
                setActiveTab("watchlist");
                setWatchlistFilter("all");
              }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-pink-500/30 rounded-2xl p-3.5 sm:p-4 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-pink-400 transition-colors">
                  İzleme Listesi
                </span>
                <Bookmark className="w-4 h-4 text-pink-400/70 group-hover:text-pink-400 transition-colors" />
              </div>
              <div className="font-bold text-2xl text-white">
                {user._count.toWatch}
              </div>
            </button>

            {/* Takipçi / Takip */}
            <div className="col-span-2 sm:col-span-1 bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-around">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Takipçi
                </div>
                <div className="font-bold text-xl sm:text-2xl text-white mt-0.5">
                  {user._count.followedBy}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Takip
                </div>
                <div className="font-bold text-xl sm:text-2xl text-white mt-0.5">
                  {user._count.following}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP 4 FAVORITES SPOTLIGHT (Letterboxd Style) */}
          {/* ========================================================================= */}
          {topFavorites.length > 0 ? (
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    Favori &amp; Öne Çıkan Yapımlar
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsManageFavoritesOpen(true)}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>Favorileri Yönet</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("watched")}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Tümünü Gör
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                {topFavorites.map((film, idx) => (
                  <Link
                    key={`${film.id}-${idx}`}
                    href={`/${film.type}/${film.id}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[2/3] bg-neutral-900 border border-white/5 hover:border-primary/50 shadow-md transition-all duration-300 hover:scale-[1.03]"
                  >
                    {film.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${film.posterPath}`}
                        alt={film.title}
                        fill
                        className="object-cover group-hover:brightness-110 transition-all"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900">
                        <Film className="w-8 h-8 text-neutral-600 mb-2" />
                        <span className="text-xs font-bold text-neutral-300 line-clamp-2">{film.title}</span>
                      </div>
                    )}

                    {/* Rating Overlay */}
                    {film.rating != null && film.rating > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-amber-500/30 flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[11px] font-bold text-white">
                          {Number(film.rating).toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Bottom Info Gradient */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <p className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                        {film.title}
                      </p>
                      {film.releaseYear && (
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {film.releaseYear}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}

                {isOwnProfile && topFavorites.length < 4 && Array.from({ length: 4 - topFavorites.length }).map((_, i) => (
                  <button
                    key={`empty-fav-slot-${i}`}
                    onClick={() => setIsManageFavoritesOpen(true)}
                    className="group relative rounded-2xl overflow-hidden aspect-[2/3] border-2 border-dashed border-white/15 hover:border-primary/50 hover:bg-white/[0.02] flex flex-col items-center justify-center p-3 text-center transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-neutral-400 group-hover:text-white mt-2 transition-colors">
                      Film Ekle
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : isOwnProfile ? (
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border border-rose-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                    <Heart className="w-6 h-6 fill-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Favori Filmlerini Belirle</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      En sevdiğin filmleri ekle, profil kapağın favorilerinden oluşan sinematik bir kolaja dönüşsün!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsManageFavoritesOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 self-start sm:self-auto"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Favori Ekle</span>
                </button>
              </div>
            </div>
          ) : null}

        </div>

        {/* ========================================================================= */}
        {/* TABBED NAVIGATION BAR */}
        {/* ========================================================================= */}
        <div className="border-t border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-2.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95",
                activeTab === "overview"
                  ? "bg-primary text-black shadow-md shadow-primary/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Compass className="w-4 h-4" />
              <span>Genel Bakış</span>
            </button>

            <button
              onClick={() => setActiveTab("watched")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95",
                activeTab === "watched"
                  ? "bg-primary text-black shadow-md shadow-primary/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Film className="w-4 h-4" />
              <span>İzlenenler</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                activeTab === "watched" ? "bg-black/20 text-black font-bold" : "bg-white/10 text-neutral-300"
              )}>
                {watchedItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("watchlist")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95",
                activeTab === "watchlist"
                  ? "bg-primary text-black shadow-md shadow-primary/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Bookmark className="w-4 h-4" />
              <span>İzleme Listesi</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                activeTab === "watchlist" ? "bg-black/20 text-black font-bold" : "bg-white/10 text-neutral-300"
              )}>
                {watchlistItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("badges")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95",
                activeTab === "badges"
                  ? "bg-primary text-black shadow-md shadow-primary/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Trophy className="w-4 h-4" />
              <span>Rozetler</span>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95",
                activeTab === "stats"
                  ? "bg-primary text-black shadow-md shadow-primary/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>İstatistikler</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENTS (WIDE, NO EXTRA EMPTY GUTTERS) */}
        {/* ========================================================================= */}
        <div className="py-6 sm:py-8">
          
          {/* TAB 1: GENEL BAKIŞ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* Zevk Uyumu (Taste Match) - Only if visiting other user & authenticated */}
              {!isOwnProfile && currentUserId && currentUserId !== user.id && (
                <div>
                  <TasteMatchCard
                    currentUserId={currentUserId}
                    profileUserId={user.id}
                    profileUserName={user.name || user.username}
                    profileUserImage={user.image}
                  />
                </div>
              )}

              {/* Şu Anda İzliyor (Currently Watching) */}
              {currentlyWatching.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary fill-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Şu Anda İzliyor
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentlyWatching.slice(0, 3).map((item: any) => (
                      <Link
                        key={item.id}
                        href={`/${item.media.type?.toLowerCase() === "tv" ? "tv" : "movie"}/${item.media.tmdbId}`}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-primary/40 transition-all group"
                      >
                        <div className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                          {item.media.posterPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w200${item.media.posterPath}`}
                              alt={item.media.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                            {item.media.title}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-0.5 capitalize">
                            {item.media.type?.toLowerCase() === "tv" ? "Dizi" : "Film"}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors shrink-0">
                          <Play className="w-3.5 h-3.5 text-primary fill-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Son Aktiviteler & İncelemeler */}
              {user.showActivities && user.activities && user.activities.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Son Aktiviteler &amp; İncelemeler
                    </h3>
                    <button
                      onClick={() => setActiveTab("watched")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Tümünü İncele
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {user.activities.slice(0, 6).map((activity: any) => (
                      <Link
                        key={activity.id}
                        href={`/${activity.media?.type?.toLowerCase() === "tv" ? "tv" : "movie"}/${activity.media?.tmdbId || activity.media?.id}`}
                        className="flex gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 transition-all group"
                      >
                        <div className="relative w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/5">
                          {activity.media?.posterPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                              alt={activity.media?.title || "Film"}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-neutral-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                                {activity.media?.title || "Başlıksız"}
                              </h4>
                              {activity.rating != null && activity.rating > 0 && (
                                <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{Number(activity.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>

                            {activity.review ? (
                              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                                &ldquo;{activity.review}&rdquo;
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-500 mt-1">
                                İzledi ve kaydetti.
                              </p>
                            )}
                          </div>

                          <div className="text-[10px] text-neutral-500 font-mono mt-2">
                            {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr }) : ""}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* En Çok İzlenen Türler (Genre Distribution) */}
              {genreBreakdown.length > 0 && user.showStats && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    En Çok İzlenen Türler
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5">
                    {genreBreakdown.map((g, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-neutral-200">{g.name}</span>
                          <span className="font-mono text-[11px] text-neutral-400">{g.label} ({g.pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500"
                            style={{ width: `${Math.max(g.pct, 5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rozetler Önizlemesi */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Kazanılan Rozetler
                  </h3>
                  <button
                    onClick={() => setActiveTab("badges")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Tüm Rozetler
                  </button>
                </div>
                <AchievementsBadges
                  achievements={[]}
                  movieCount={stats.movieCount}
                  showCount={stats.showCount}
                  watchedCount={user._count.watched}
                  averageRating={averageRating}
                />
              </div>

              {/* Favori Kişiler (Oyuncular & Yönetmenler) */}
              {user.favoritePersons && user.favoritePersons.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Favori Sinemacılar &amp; Oyuncular
                  </h3>
                  <FavoritePersons
                    persons={user.favoritePersons}
                    maxDisplay={8}
                    variant="grid"
                  />
                </div>
              )}

            </div>
          )}

          {/* TAB 2: İZLENENLER */}
          {activeTab === "watched" && (
            <div className="space-y-6">
              {/* Filters & Sorting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => setWatchedFilter("all")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchedFilter === "all" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Tümü ({watchedItems.length})
                  </button>
                  <button
                    onClick={() => setWatchedFilter("movie")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchedFilter === "movie" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Filmler ({stats.movieCount})
                  </button>
                  <button
                    onClick={() => setWatchedFilter("tv")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchedFilter === "tv" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Diziler ({stats.showCount})
                  </button>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-xs text-neutral-500 font-bold mr-1">Sırala:</span>
                  <button
                    onClick={() => setWatchedSort("recent")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchedSort === "recent" ? "bg-primary/20 text-primary border border-primary/30" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    En Son
                  </button>
                  <button
                    onClick={() => setWatchedSort("rating")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchedSort === "rating" ? "bg-primary/20 text-primary border border-primary/30" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    En Yüksek Puan
                  </button>
                </div>
              </div>

              {/* Media Grid (Full width, responsive 2 to 6 columns) */}
              {displayedWatched.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                  {displayedWatched.map((item: any) => {
                    const media = item.media;
                    const type = media?.type?.toLowerCase() === "tv" ? "tv" : "movie";
                    return (
                      <Link
                        key={item.id}
                        href={`/${type}/${media.tmdbId}`}
                        className="group relative rounded-2xl overflow-hidden aspect-[2/3] bg-neutral-900 border border-white/5 hover:border-primary/50 shadow-md transition-all duration-300 hover:scale-[1.03]"
                      >
                        {media.posterPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${media.posterPath}`}
                            alt={media.title}
                            fill
                            className="object-cover group-hover:brightness-110 transition-all"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900">
                            <Film className="w-8 h-8 text-neutral-600 mb-2" />
                            <span className="text-xs font-bold text-neutral-300 line-clamp-2">{media.title}</span>
                          </div>
                        )}

                        {/* Rating Badge */}
                        {item.rating != null && item.rating > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-amber-500/30 flex items-center gap-1 shadow-lg">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-bold text-white">
                              {Number(item.rating).toFixed(1)}
                            </span>
                          </div>
                        )}

                        {/* Title & Info */}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                          <p className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                            {media.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-0.5">
                            <span>{type === "tv" ? "Dizi" : "Film"}</span>
                            {item.watchedAt && (
                              <span>{new Date(item.watchedAt).toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-white/[0.02] border border-white/5 border-dashed rounded-3xl p-8">
                  <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white">Henüz izlenen içerik yok</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    İzlenen filmler ve diziler kaydedildikçe burada listelenecektir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: İZLEME LİSTESİ */}
          {activeTab === "watchlist" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setWatchlistFilter("all")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchlistFilter === "all" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Tümü ({watchlistItems.length})
                  </button>
                  <button
                    onClick={() => setWatchlistFilter("movie")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchlistFilter === "movie" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Filmler
                  </button>
                  <button
                    onClick={() => setWatchlistFilter("tv")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      watchlistFilter === "tv" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Diziler
                  </button>
                </div>
              </div>

              {/* Media Grid */}
              {displayedWatchlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                  {displayedWatchlist.map((item: any) => {
                    const media = item.media;
                    const type = media?.type?.toLowerCase() === "tv" ? "tv" : "movie";
                    return (
                      <Link
                        key={item.id}
                        href={`/${type}/${media.tmdbId}`}
                        className="group relative rounded-2xl overflow-hidden aspect-[2/3] bg-neutral-900 border border-white/5 hover:border-primary/50 shadow-md transition-all duration-300 hover:scale-[1.03]"
                      >
                        {media.posterPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${media.posterPath}`}
                            alt={media.title}
                            fill
                            className="object-cover group-hover:brightness-110 transition-all"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900">
                            <Bookmark className="w-8 h-8 text-neutral-600 mb-2" />
                            <span className="text-xs font-bold text-neutral-300 line-clamp-2">{media.title}</span>
                          </div>
                        )}

                        {/* TMDB Rating Badge */}
                        {media.voteAverage != null && media.voteAverage > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-lg">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-bold text-white">
                              {Number(media.voteAverage).toFixed(1)}
                            </span>
                          </div>
                        )}

                        {/* Title & Info */}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                          <p className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                            {media.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-0.5">
                            <span>{type === "tv" ? "Dizi" : "Film"}</span>
                            {media.releaseDate && (
                              <span>{new Date(media.releaseDate).getFullYear()}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-white/[0.02] border border-white/5 border-dashed rounded-3xl p-8">
                  <Bookmark className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white">İzleme listesi henüz boş</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    Daha sonra izlemek istediğiniz yapımları ekleyerek listenizi doldurabilirsiniz.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ROZETLER */}
          {activeTab === "badges" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Tüm Başarılar &amp; Rozetler</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  İzleme hedefleri ve topluluk aktiviteleriyle kazanılan rozetler.
                </p>
              </div>
              <AchievementsBadges
                achievements={[]}
                movieCount={stats.movieCount}
                showCount={stats.showCount}
                watchedCount={user._count.watched}
                averageRating={averageRating}
              />
            </div>
          )}

          {/* TAB 5: İSTATİSTİKLER & ANALİZ */}
          {activeTab === "stats" && (
            <div className="space-y-8">
              {user.showStats ? (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white">İzleme Alışkanlıkları</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Zamana göre izleme frekansı ve değerlendirme istatistikleri.
                    </p>
                    <div className="mt-4">
                      <PeriodStats activities={user.activities} watchedItems={watchedItems} userId={user.id} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <h3 className="text-base font-bold text-white mb-4">Dünya Sineması (İzlenen Ülkeler)</h3>
                    <WatchCountries watchedItems={watchedItems} />
                  </div>

                  {user.favoriteGenres && user.favoriteGenres.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h3 className="text-base font-bold text-white mb-3">Favori Tür Tercihleri</h3>
                      <GenreTags
                        genres={allGenres}
                        favoriteGenreIds={user.favoriteGenres}
                        maxDisplay={20}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center bg-white/[0.02] border border-white/5 border-dashed rounded-3xl p-8">
                  <Lock className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">İstatistikler Gizli</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Kullanıcı izleme istatistiklerini gizli tutmayı tercih etmiştir.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Manage Favorites Modal */}
      {isOwnProfile && (
        <ManageFavoritesModal
          isOpen={isManageFavoritesOpen}
          onClose={() => setIsManageFavoritesOpen(false)}
          currentFavoriteIds={localFavorites}
          watchedItems={watchedItems}
          onFavoritesChange={setLocalFavorites}
        />
      )}
    </div>
  );
}
