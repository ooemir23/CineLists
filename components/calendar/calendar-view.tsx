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
import { UpcomingEpisode } from "@/lib/hero-personalization-actions";

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
type UserTimeFilter = "all" | "week" | "today";

export function CalendarView({
  upcomingMovies,
  upcomingTV,
  nowPlayingMovies,
  userUpcomingEpisodes,
  locale,
  userCountry,
}: CalendarViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [userTimeFilter, setUserTimeFilter] = useState<UserTimeFilter>("week");
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

  // User personalized upcoming items with time filter
  const thisWeekCount = useMemo(() => {
    return userUpcomingEpisodes.filter((ep) => (ep.daysLeft ?? 999) <= 7).length;
  }, [userUpcomingEpisodes]);

  const todayCount = useMemo(() => {
    return userUpcomingEpisodes.filter((ep) => (ep.daysLeft ?? 999) === 0).length;
  }, [userUpcomingEpisodes]);

  const filteredEpisodes = useMemo(() => {
    return userUpcomingEpisodes.filter((ep) => {
      const days = ep.daysLeft ?? 999;
      if (userTimeFilter === "today" && days !== 0) return false;
      if (userTimeFilter === "week" && days > 7) return false;

      if (searchQuery.trim()) {
        const matchTitle = ep.showTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchEp = (ep.nextEpisodeTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchTitle && !matchEp) return false;
      }
      return true;
    });
  }, [userUpcomingEpisodes, userTimeFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. TOP SPOTLIGHT: Tracked Shows & Movies Upcoming Countdown */}
      {userUpcomingEpisodes.length > 0 && (
        <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/20 p-4 sm:p-6 backdrop-blur-xl shadow-2xl shadow-amber-400/5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  {isTr ? "Takip Ettiğin Dizi & Filmlerden Yaklaşanlar" : "Upcoming from Your Tracked Shows & Movies"}
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {userUpcomingEpisodes.length}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {isTr
                    ? "İzlediğin dizilerin yeni bölümleri ve takip ettiğin filmlerin vizyon tarihleri"
                    : "New episodes of your shows and theatrical releases of movies in your watchlist"}
                </p>
              </div>
            </div>

            {/* Time Filter Chips */}
            <div className="flex items-center gap-1.5 self-start md:self-center bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setUserTimeFilter("week")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                  userTimeFilter === "week"
                    ? "bg-amber-400 text-slate-950 shadow-sm font-black"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <span>{isTr ? "1 Hafta İçinde" : "Next 7 Days"}</span>
                {thisWeekCount > 0 && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.2 rounded-full",
                    userTimeFilter === "week" ? "bg-slate-950/20 text-slate-950" : "bg-white/10 text-neutral-300"
                  )}>
                    {thisWeekCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setUserTimeFilter("today")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                  userTimeFilter === "today"
                    ? "bg-amber-400 text-slate-950 shadow-sm font-black"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <span>{isTr ? "Bugün" : "Today"}</span>
                {todayCount > 0 && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.2 rounded-full",
                    userTimeFilter === "today" ? "bg-slate-950/20 text-slate-950" : "bg-white/10 text-neutral-300"
                  )}>
                    {todayCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setUserTimeFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                  userTimeFilter === "all"
                    ? "bg-amber-400 text-slate-950 shadow-sm font-black"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {isTr ? "Tümü" : "All"} ({userUpcomingEpisodes.length})
              </button>
            </div>
          </div>

          {filteredEpisodes.length === 0 ? (
            <div className="py-6 px-4 text-center rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-xs font-bold text-neutral-400">
                {userTimeFilter === "today"
                  ? isTr
                    ? "Bugün yayınlanacak yeni bir bölüm veya vizyona girecek film bulunmuyor."
                    : "No episodes or releases scheduled for today."
                  : userTimeFilter === "week"
                  ? isTr
                    ? "Önümüzdeki 1 hafta içinde yayınlanacak bölüm bulunmuyor. Diğer yaklaşanları görmek için 'Tümü' seçeneğine bakabilirsiniz."
                    : "No releases scheduled within the next 7 days. Check 'All' to see future dates."
                  : isTr
                  ? "Takip ettiğin yapımlardan yaklaşan içerik bulunamadı."
                  : "No upcoming content found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredEpisodes.map((item) => {
                const days = item.daysLeft ?? 0;
                const isMovie = item.mediaType === "movie" || item.isTheatrical;

                return (
                  <Link
                    key={`${item.mediaType}-${item.showId}-${item.nextEpisodeDate}`}
                    href={`/${item.mediaType}/${item.showId}`}
                    className={cn(
                      "group flex gap-3.5 p-3.5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
                      isMovie
                        ? "border-amber-400/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 hover:border-amber-400"
                        : days <= 7
                        ? "border-sky-400/40 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 hover:border-sky-400"
                        : "border-white/10 bg-slate-900/80 hover:border-white/20"
                    )}
                  >
                    {/* Mini Poster */}
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-md">
                      {item.posterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                          alt={item.showTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {isMovie ? (
                            <Film className="w-7 h-7 text-neutral-600" />
                          ) : (
                            <Tv className="w-7 h-7 text-neutral-600" />
                          )}
                        </div>
                      )}

                      {/* Type Badge on Poster */}
                      <div className="absolute top-1.5 left-1.5">
                        <span
                          className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider",
                            isMovie
                              ? "bg-rose-500 text-white"
                              : "bg-sky-500 text-white"
                          )}
                        >
                          {isMovie ? (isTr ? "FİLM" : "MOVIE") : (isTr ? "DİZİ" : "TV")}
                        </span>
                      </div>
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        {/* Countdown Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={cn(
                              "text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider",
                              days === 0
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                                : days === 1
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : days <= 7
                                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                : "bg-white/10 text-neutral-300 border border-white/10"
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {days === 0
                              ? isTr ? "Bugün" : "Today"
                              : days === 1
                              ? isTr ? "Yarın" : "Tomorrow"
                              : isTr ? `${days} gün sonra` : `in ${days} days`}
                          </span>

                          {days <= 7 && days > 1 && (
                            <span className="text-[9px] font-bold text-amber-400">
                              {isTr ? "1 Hafta İçinde" : "This Week"}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-black text-white truncate group-hover:text-amber-400 transition-colors">
                          {item.showTitle}
                        </h3>

                        {/* Episode / Theatrical details */}
                        <p className="text-xs font-bold text-neutral-300 mt-1 line-clamp-1">
                          {isMovie ? (
                            <span className="text-amber-300 flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {isTr ? "Sinemalarda Vizyona Giriyor" : "Theatrical Release"}
                            </span>
                          ) : item.nextEpisodeSeason && item.nextEpisodeNumber ? (
                            <span className="text-sky-300">
                              {item.nextEpisodeSeason}. {isTr ? "Sezon" : "Season"} {item.nextEpisodeNumber}. {isTr ? "Bölüm" : "Episode"}
                              {item.nextEpisodeTitle && (
                                <span className="text-neutral-400 font-medium"> · {item.nextEpisodeTitle}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-sky-300">{isTr ? "Yeni Bölüm" : "New Episode"}</span>
                          )}
                        </p>
                      </div>

                      {/* Release Date & Platforms */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 mt-2">
                        <span className="text-[11px] text-neutral-400 font-medium truncate">
                          {formatDate(item.nextEpisodeDate)}
                        </span>

                        {item.platforms && item.platforms.length > 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded shrink-0",
                              isMovie
                                ? "bg-amber-400/15 text-amber-300"
                                : "bg-sky-400/15 text-sky-300"
                            )}
                          >
                            {item.platforms.slice(0, 2).join(" • ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
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
