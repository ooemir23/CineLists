"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, ChevronRight, Star, Heart, User, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  image: string | null;
  bio: string | null;
  isPrivate: boolean;
  showActivities: boolean;
  showStats: boolean;
  favoriteGenres: string[];
  platforms: string[];
  favoritePersons: any[];
  activities: any[];
  _count: {
    followedBy: number;
    following: number;
    toWatch: number;
    watched: number;
  };
}

interface ProfileClientShellProps {
  user: UserData;
  stats: { movieCount: number; showCount: number; episodeCount: number };
  recentMediaItems: any[];
  allGenres: { id: number; name: string }[];
  thisMonthCount: number;
  averageRating: number;
  watchedItems?: any[];
  watchlistItems?: any[];
}

export function ProfileClientShell({
  user,
  stats,
  recentMediaItems,
  allGenres,
  thisMonthCount,
  averageRating,
  watchedItems = [],
  watchlistItems = [],
}: ProfileClientShellProps) {
  const router = useRouter();

  // Avatar gradient helper
  const getAvatarGradient = (name: string) => {
    const gradients = [
      "linear-gradient(135deg,#f472b6,#be185d)",
      "linear-gradient(135deg,#38bdf8,#1d4ed8)",
      "linear-gradient(135deg,#34d399,#047857)",
      "linear-gradient(135deg,#fbbf24,#b45309)",
      "linear-gradient(135deg,#a78bfa,#6d28d9)",
      "linear-gradient(135deg,#f4c14e,#b45309)",
    ];
    let sum = 0;
    const displayName = name || "User";
    for (let i = 0; i < displayName.length; i++) sum += displayName.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  const avatarGradient = getAvatarGradient(user.name || "");
  const initial = (user.name || "U").substring(0, 1).toUpperCase();

  // Dynamic genre stats based on watched history
  const genreBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    watchedItems.forEach((w: any) => {
      if (w.media?.genres) {
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
      .slice(0, 4);
  }, [watchedItems]);

  // Standard fallback genres if watchedItems is empty
  const defaultGenres = [
    { name: "Polisiye", pct: 84, label: "64 film" },
    { name: "Gerilim", pct: 67, label: "51 film" },
    { name: "Bilim Kurgu", pct: 48, label: "37 film" },
    { name: "Dram", pct: 39, label: "30 film" },
  ];

  const genresToRender = genreBreakdown.length > 0 ? genreBreakdown : defaultGenres;

  // Favorites list (real watchedItems or recent media)
  const favorites = useMemo(() => {
    return recentMediaItems.slice(0, 4).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type === "TV" ? "tv" : "movie",
      poster: item.posterPath 
        ? `https://image.tmdb.org/t/p/w342${item.posterPath}` 
        : "linear-gradient(150deg,#28323f,#0d1117)",
    }));
  }, [recentMediaItems]);

  // Redesign stats block
  const statsList = [
    { value: user._count.watched.toString(), label: "İzlenen" },
    { value: (user._count.toWatch > 0 ? 2 : 0 + (user._count.watched > 0 ? 1 : 0)).toString(), label: "Liste" },
    { value: user._count.followedBy.toString(), label: "Takipçi" },
  ];

  return (
    <div className="w-full min-h-screen bg-background font-hanken text-foreground pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 pt-2 sm:pt-6">
        <div className="bg-[#0b1120] rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Cover Header Banner */}
          <div className="relative h-36 sm:h-48 bg-gradient-to-br from-slate-800 via-slate-900 to-[#0b1120]">
            <div className="absolute inset-0 bg-radial-to-bl from-primary/15 via-transparent to-transparent" />
            <div className="absolute top-4 right-4 flex justify-end gap-2">
              <button 
                onClick={() => router.push("/settings/general")}
                className="h-9 px-3.5 rounded-xl bg-black/50 backdrop-blur-md flex items-center gap-2 border border-white/10 text-slate-200 hover:text-white transition-all active:scale-95 text-xs font-bold"
                aria-label="Ayarlar"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Ayarlar</span>
              </button>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-4 sm:px-8 -mt-12 sm:-mt-16 relative z-10">
            {/* User Avatar */}
            {user.image ? (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-[4px] border-[#0b1120] relative shadow-2xl">
                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
              </div>
            ) : (
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center font-bricolage font-bold text-4xl text-white border-[4px] border-[#0b1120] shadow-2xl"
                style={{ background: avatarGradient }}
              >
                {initial}
              </div>
            )}

            {/* Name / Handle Header */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bricolage font-bold text-2xl sm:text-3xl tracking-tight text-white truncate">
                  {user.name || "CineUser"}
                </h2>
                <div className="font-mono text-xs text-slate-500 mt-0.5 tracking-wide">
                  @{user.username || "username"}
                </div>
              </div>
              <button 
                onClick={() => router.push("/settings/general")}
                className="self-start sm:self-auto bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 shadow-md"
              >
                Profili Düzenle
              </button>
            </div>

            {/* Biography */}
            <p className="text-sm leading-relaxed text-slate-400 mt-3.5 font-medium max-w-2xl">
              {user.bio || "Henüz bir biyografi yazılmamış."}
            </p>

            {/* Profile Statistics Block */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-6">
              {statsList.map((s, i) => (
                <div 
                  key={i} 
                  className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 sm:p-4 text-center shadow-md"
                >
                  <div className="font-bricolage font-bold text-xl sm:text-2xl leading-none text-white">
                    {s.value}
                  </div>
                  <div className="font-mono text-[10px] tracking-wider uppercase text-slate-500 mt-1.5 font-bold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Movies Section */}
          {favorites.length > 0 && (
            <div className="mt-8 px-4 sm:px-8">
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-bricolage font-bold text-lg text-white tracking-tight">Favori Yapımlarım</h3>
                <ChevronRight size={18} className="text-slate-600" />
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {favorites.map((film, index) => (
                  <Link
                    key={`${film.id}-${index}`}
                    href={`/${film.type}/${film.id}`}
                    className="flex-none w-24 sm:w-28 group"
                  >
                    <div 
                      className="relative w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden bg-cover bg-center shadow-[0_8px_20px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center p-3 text-center transition-transform group-hover:scale-105"
                      style={{ 
                        backgroundImage: film.poster.startsWith("http") ? `url(${film.poster})` : film.poster,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Star size={20} className="text-primary" fill="currentColor" />
                      </div>
                      {!film.poster.startsWith("http") && (
                        <span className="font-bricolage font-bold text-xs text-white/95">{film.title}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Lists Section */}
          <div className="mt-8 px-4 sm:px-8">
            <h3 className="font-bricolage font-bold text-lg text-white tracking-tight mb-3">Listelerim</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Watchlist */}
              {watchlistItems.length > 0 && (
                <Link
                  href="/watchlist"
                  className="flex gap-3 items-center bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex shrink-0 -space-x-2.5 pl-1">
                    {watchlistItems.slice(0, 3).map((item, i) => (
                      <div 
                        key={i}
                        className="w-[32px] h-12 rounded-lg bg-cover bg-center border-[1.5px] border-[#0b1120] shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                        style={{ 
                          backgroundImage: item.media.posterPath ? `url(https://image.tmdb.org/t/p/w185${item.media.posterPath})` : "none",
                          backgroundColor: "#131b2c"
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors tracking-tight">
                      İzleme Listem
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5 tracking-wide font-bold">
                      {watchlistItems.length} yapım
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </Link>
              )}

              {/* Watched List */}
              {watchedItems.length > 0 && (
                <Link
                  href="/watched"
                  className="flex gap-3 items-center bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex shrink-0 -space-x-2.5 pl-1">
                    {watchedItems.slice(0, 3).map((item, i) => (
                      <div 
                        key={i}
                        className="w-[32px] h-12 rounded-lg bg-cover bg-center border-[1.5px] border-[#0b1120] shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                        style={{ 
                          backgroundImage: item.media.posterPath ? `url(https://image.tmdb.org/t/p/w185${item.media.posterPath})` : "none",
                          backgroundColor: "#131b2c"
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors tracking-tight">
                      İzlediklerim
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5 tracking-wide font-bold">
                      {watchedItems.length} yapım
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </Link>
              )}
            </div>
          </div>

          {/* Genre Statistics Progress Bars */}
          <div className="mt-8 px-4 sm:px-8 pb-8">
            <h3 className="font-bricolage font-bold text-lg text-white tracking-tight mb-4">En Çok İzlediğin Türler</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
              {genresToRender.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-xs font-bold text-slate-200">{g.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{g.label}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500" 
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
