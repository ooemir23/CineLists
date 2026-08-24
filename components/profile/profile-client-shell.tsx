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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-7 bg-radial from-[#11182b] to-[#06080e] font-hanken text-[#f1f5f9]">
      <div className="w-[393px] h-[840px] max-h-[calc(100vh-40px)] relative overflow-hidden bg-[#020617] rounded-[42px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8),_0_0_0_10px_#0a0e18] flex flex-col justify-between">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          
          {/* Cover Header Banner */}
          <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-950">
            <div className="absolute inset-0 bg-radial-to-bl from-primary/15 via-transparent to-transparent" />
            <div className="absolute top-12 left-5 right-5 flex justify-end gap-2">
              <button 
                onClick={() => router.push("/settings/general")}
                className="w-[36px] h-[36px] rounded-xl bg-black/45 backdrop-blur-md flex items-center justify-center border border-white/10 text-slate-300 hover:text-white transition-colors"
                aria-label="Ayarlar"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-5 -mt-11 relative z-10">
            {/* User Avatar */}
            {user.image ? (
              <div className="w-22 h-22 rounded-3xl overflow-hidden border-[4px] border-[#020617] relative shadow-2xl">
                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
              </div>
            ) : (
              <div 
                className="w-22 h-22 rounded-3xl flex items-center justify-center font-bricolage font-bold text-4xl text-white border-[4px] border-[#020617] shadow-2xl"
                style={{ background: avatarGradient }}
              >
                {initial}
              </div>
            )}

            {/* Name / Handle Header */}
            <div className="mt-3.5 flex items-start justify-between">
              <div className="min-w-0">
                <h2 className="font-bricolage font-bold text-2xl tracking-tight text-white truncate max-w-[200px]">
                  {user.name || "CineUser"}
                </h2>
                <div className="font-mono text-xs text-slate-500 mt-0.5 tracking-wide">
                  @{user.username || "username"}
                </div>
              </div>
              <button 
                onClick={() => router.push("/settings/general")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              >
                Düzenle
              </button>
            </div>

            {/* Biography */}
            <p className="text-[13.5px] leading-relaxed text-slate-400 mt-3 font-medium">
              {user.bio || "Henüz bir biyografi yazılmamış."}
            </p>

            {/* Profile Statistics Block */}
            <div className="flex gap-2 mt-4.5">
              {statsList.map((s, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center"
                >
                  <div className="font-bricolage font-bold text-xl leading-none text-white">
                    {s.value}
                  </div>
                  <div className="font-mono text-[9px] tracking-wider uppercase text-slate-500 mt-1 font-bold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Movies Section */}
          {favorites.length > 0 && (
            <>
              <div className="flex items-center justify-between px-5 pt-7 pb-3">
                <h3 className="font-bricolage font-bold text-[17px] text-white tracking-tight">Favori Yapımlarım</h3>
                <ChevronRight size={18} className="text-slate-600" />
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
                {favorites.map((film, index) => (
                  <Link
                    key={`${film.id}-${index}`}
                    href={`/${film.type}/${film.id}`}
                    className="flex-none w-24 group"
                  >
                    <div 
                      className="relative w-24 aspect-[2/3] rounded-xl overflow-hidden bg-cover bg-center shadow-[0_8px_20px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center p-3 text-center"
                      style={{ 
                        backgroundImage: film.poster.startsWith("http") ? `url(${film.poster})` : film.poster,
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Star size={18} className="text-primary" fill="currentColor" />
                      </div>
                      {!film.poster.startsWith("http") && (
                        <span className="font-bricolage font-bold text-xs text-white/95">{film.title}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Lists Section */}
          <div className="px-5 pt-7 pb-3">
            <h3 className="font-bricolage font-bold text-[17px] text-white tracking-tight">Listelerim</h3>
          </div>
          
          <div className="flex flex-col gap-2.5 px-5">
            {/* Watchlist */}
            {watchlistItems.length > 0 && (
              <Link
                href="/watchlist"
                className="flex gap-3 items-center bg-[#0b1120] border border-white/5 rounded-2xl p-2.5 hover:border-white/10 transition-all group"
              >
                <div className="flex shrink-0 -space-x-2.5 pl-2">
                  {watchlistItems.slice(0, 3).map((item, i) => (
                    <div 
                      key={i}
                      className="w-[30px] h-11 rounded-lg bg-cover bg-center border-[1.5px] border-[#0b1120] shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                      style={{ 
                        backgroundImage: item.media.posterPath ? `url(https://image.tmdb.org/t/p/w185${item.media.posterPath})` : "none",
                        backgroundColor: "#131b2c"
                      }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-white group-hover:text-primary transition-colors tracking-tight">
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
                className="flex gap-3 items-center bg-[#0b1120] border border-white/5 rounded-2xl p-2.5 hover:border-white/10 transition-all group"
              >
                <div className="flex shrink-0 -space-x-2.5 pl-2">
                  {watchedItems.slice(0, 3).map((item, i) => (
                    <div 
                      key={i}
                      className="w-[30px] h-11 rounded-lg bg-cover bg-center border-[1.5px] border-[#0b1120] shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                      style={{ 
                        backgroundImage: item.media.posterPath ? `url(https://image.tmdb.org/t/p/w185${item.media.posterPath})` : "none",
                        backgroundColor: "#131b2c"
                      }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-white group-hover:text-primary transition-colors tracking-tight">
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

          {/* Genre Statistics Progress Bars */}
          <div className="px-5 pt-7 pb-3">
            <h3 className="font-bricolage font-bold text-[17px] text-white tracking-tight">En Çok İzlediğin Türler</h3>
          </div>
          
          <div className="flex flex-col gap-3.5 px-5 pb-5">
            {genresToRender.map((g, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs font-bold text-slate-200">{g.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 font-bold">{g.label}</span>
                </div>
                <div className="h-[7px] rounded-full bg-white/5 overflow-hidden border border-white/5">
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
  );
}
