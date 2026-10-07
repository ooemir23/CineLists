"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Film,
  Tv,
  Star,
  Clock,
  Sparkles,
  Search,
  Filter,
  Layers,
  Flame,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpcomingEpisode } from "@/lib/calendar-types";
import { UpcomingEpisodesCarousel } from "@/components/home/carousels/upcoming-episodes-carousel";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { calendarToday } from "@/lib/calendar-dates";

export interface CalendarMediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: "movie" | "tv";
  overview?: string;
  isNowPlaying?: boolean;
}

interface CalendarViewProps {
  upcomingMovies: CalendarMediaItem[];
  upcomingTV: CalendarMediaItem[];
  nowPlayingMovies: CalendarMediaItem[];
  userUpcomingEpisodes: UpcomingEpisode[];
  locale: "tr" | "en";
  userCountry: string;
}

type TabType = "all" | "episodes" | "movies" | "tv" | "theatrical";

export function CalendarView({
  upcomingMovies,
  upcomingTV,
  nowPlayingMovies,
  userUpcomingEpisodes,
  locale,
  userCountry,
}: CalendarViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const { dict } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const isTr = locale === "tr";

  // Calculate days left
  const getDaysLeft = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const today = new Date();
    const target = new Date(dateStr);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffMs = startOfTarget.getTime() - startOfToday.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) return isTr ? "Vizyonda" : "Released";
    if (days === 0) return isTr ? "Bugün" : "Today";
    if (days === 1) return isTr ? "Yarın" : "Tomorrow";
    return isTr ? `${days} gün kaldı` : `${days} days left`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return isTr ? "Tarih belirtilmedi" : "Date TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString(isTr ? "tr-TR" : "en-GB", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  };

  // Combined and sorted general items
  const allMediaItems = useMemo(() => {
    const combined: CalendarMediaItem[] = [
      ...upcomingMovies.map((m) => ({ ...m, media_type: "movie" as const })),
      ...upcomingTV.map((t) => ({ ...t, media_type: "tv" as const })),
      ...nowPlayingMovies.map((np) => ({
        ...np,
        media_type: "movie" as const,
        isNowPlaying: true,
      })),
    ];
    return combined;
  }, [upcomingMovies, upcomingTV, nowPlayingMovies]);

  // Filtered general media items
  const filteredMedia = useMemo(() => {
    return allMediaItems.filter((item) => {
      // Tab filter
      if (activeTab === "movies" && (item.media_type !== "movie" || item.isNowPlaying))
        return false;
      if (activeTab === "tv" && item.media_type !== "tv") return false;
      if (activeTab === "theatrical" && !item.isNowPlaying) return false;

      // Query filter
      if (searchQuery.trim()) {
        const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (!titleMatch) return false;
      }

      return true;
    });
  }, [allMediaItems, activeTab, searchQuery]);

  return (
    <div className="space-y-8">
      {userUpcomingEpisodes.length > 0 && (
        <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/20 p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-black text-white">{dict.calendarUi.personalTitle}</h2>
          <p className="text-xs text-neutral-400">{dict.calendarUi.personalHint}</p>
          <UpcomingEpisodesCarousel episodes={userUpcomingEpisodes} today={calendarToday()} query={searchQuery} />
        </section>
      )}

      {/* 2. GENERAL CALENDAR SECTION (Discover Coming Soon & In Theatres) */}
      <section className="space-y-6">
        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                activeTab === "all"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              )}
            >
              {isTr ? "Tüm Takvim" : "All Calendar"} ({allMediaItems.length})
            </button>

            <button
              onClick={() => setActiveTab("movies")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === "movies"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Film className="w-3.5 h-3.5" />
              {isTr ? "Yakında Filmler" : "Upcoming Movies"} ({upcomingMovies.length})
            </button>

            <button
              onClick={() => setActiveTab("tv")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === "tv"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Tv className="w-3.5 h-3.5" />
              {isTr ? "Yakında Diziler" : "Upcoming TV Series"} ({upcomingTV.length})
            </button>

            <button
              onClick={() => setActiveTab("theatrical")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === "theatrical"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {isTr ? "Vizyondakiler" : "In Theatres"} ({nowPlayingMovies.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTr ? "Takvimde ara..." : "Search calendar..."}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              {activeTab === "movies"
                ? isTr
                  ? "Yakında Vizyona Girecek Filmler"
                  : "Upcoming Movies"
                : activeTab === "tv"
                ? isTr
                  ? "Yakında Başlayacak Diziler"
                  : "Upcoming TV Series"
                : activeTab === "theatrical"
                ? isTr
                  ? "Şu Anda Sinemalarda Gösterimde"
                  : "Now Playing in Theatres"
                : isTr
                ? "Yakında Çıkacaklar & Vizyondakiler"
                : "Coming Soon & In Theatres"}
            </h2>
            <span className="text-xs text-neutral-400 font-medium">
              {filteredMedia.length} {isTr ? "yapım listelendi" : "titles found"}
            </span>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10">
              <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">
                {isTr ? "İçerik bulunamadı" : "No titles found"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {isTr
                  ? "Filtreleri veya arama kelimesini değiştirerek tekrar deneyebilirsiniz."
                  : "Try clearing search filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {filteredMedia.map((item) => {
                const releaseDate = item.release_date || item.first_air_date;
                const daysLeft = getDaysLeft(releaseDate);

                return (
                  <Link
                    key={`${item.media_type}-${item.id}`}
                    href={`/${item.media_type}/${item.id}`}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-amber-400/50 transition-all duration-300 shadow-md">
                      {item.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          {item.media_type === "movie" ? (
                            <Film className="w-8 h-8 text-neutral-600" />
                          ) : (
                            <Tv className="w-8 h-8 text-neutral-600" />
                          )}
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                        <span
                          className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider",
                            item.isNowPlaying
                              ? "bg-amber-500 text-slate-950 font-black"
                              : item.media_type === "movie"
                              ? "bg-blue-600/90 text-white"
                              : "bg-purple-600/90 text-white"
                          )}
                        >
                          {item.isNowPlaying
                            ? isTr
                              ? "SİNEMADA"
                              : "THEATRES"
                            : item.media_type === "movie"
                            ? isTr
                              ? "FİLM"
                              : "MOVIE"
                            : isTr
                              ? "DİZİ"
                              : "SERIES"}
                        </span>
                      </div>

                      {/* Score Badge */}
                      {item.vote_average > 0 && (
                        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md rounded-lg px-1.5 py-0.5 flex items-center gap-1 border border-white/10 z-10">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-black text-white">
                            {item.vote_average.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Bottom Date Overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2.5 pt-6 flex flex-col justify-end">
                        {daysLeft && (
                          <span className="text-[10px] font-black text-amber-400">
                            {daysLeft}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-300 font-medium">
                          {formatDate(releaseDate)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white mt-2 truncate group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
