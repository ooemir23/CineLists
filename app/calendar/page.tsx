import { auth } from "@/auth";
import { tmdb } from "@/lib/tmdb";
import { Calendar, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { getWatchedShowsNextEpisodes } from "@/lib/hero-personalization-actions";
import { getServerLocale } from "@/lib/i18n/server";
import { getServerCountry, getCountryName } from "@/lib/country";
import { CalendarView } from "@/components/calendar/calendar-view";

export const revalidate = 300; // 5 minutes cache

export default async function CalendarPage() {
  const session = await auth();
  const locale = await getServerLocale();
  const userCountry = await getServerCountry();
  const tmdbLang = locale === "en" ? "en-US" : "tr-TR";
  const todayStr = new Date().toISOString().split("T")[0];

  const [upcomingMoviesData, upcomingTVData, nowPlayingData, upcomingEpisodes] =
    await Promise.all([
      tmdb
        .discover("movie", {
          sort_by: "popularity.desc",
          "primary_release_date.gte": todayStr,
          region: userCountry,
          language: tmdbLang,
          "vote_count.gte": "5",
        })
        .catch(() => ({ results: [] })),
      tmdb
        .discover("tv", {
          sort_by: "popularity.desc",
          "first_air_date.gte": todayStr,
          language: tmdbLang,
          "vote_count.gte": "5",
        })
        .catch(() => ({ results: [] })),
      tmdb
        .discover("movie", {
          sort_by: "primary_release_date.desc",
          "primary_release_date.lte": todayStr,
          region: userCountry,
          language: tmdbLang,
          "vote_count.gte": "20",
        })
        .catch(() => ({ results: [] })),
      session?.user?.id
        ? getWatchedShowsNextEpisodes(userCountry).catch(() => [])
        : Promise.resolve([]),
    ]);

  const upcomingMovies = (upcomingMoviesData?.results || []).slice(0, 24).map((m: any) => ({
    id: m.id,
    title: m.title || m.name || "",
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_date: m.release_date,
    vote_average: m.vote_average || 0,
    media_type: "movie" as const,
    overview: m.overview,
  }));

  const upcomingTV = (upcomingTVData?.results || []).slice(0, 24).map((t: any) => ({
    id: t.id,
    title: t.name || t.title || "",
    poster_path: t.poster_path,
    backdrop_path: t.backdrop_path,
    first_air_date: t.first_air_date,
    vote_average: t.vote_average || 0,
    media_type: "tv" as const,
    overview: t.overview,
  }));

  const nowPlayingMovies = (nowPlayingData?.results || []).slice(0, 18).map((m: any) => ({
    id: m.id,
    title: m.title || m.name || "",
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_date: m.release_date,
    vote_average: m.vote_average || 0,
    media_type: "movie" as const,
    overview: m.overview,
    isNowPlaying: true,
  }));

  const countryName = getCountryName(userCountry, locale);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-h-screen">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {locale === "en" ? "Back to Home" : "Ana Sayfaya Dön"}
        </Link>
        <span className="text-xs font-bold text-neutral-400">
          📍 {countryName} ({userCountry})
        </span>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 p-5 sm:p-7 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/10">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  {locale === "en" ? "Release Calendar & Coming Soon" : "Yayın Takvimi & Yakında Çıkacaklar"}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  {locale === "en" ? "Live TMDB" : "Canlı Takvim"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                {locale === "en"
                  ? `Discover upcoming theatrical releases and new streaming seasons in ${countryName}.`
                  : `${countryName} için yakında vizyona girecek filmleri ve platformlara eklenecek yeni sezonları keşfet.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Calendar Content */}
      <CalendarView
        upcomingMovies={upcomingMovies}
        upcomingTV={upcomingTV}
        nowPlayingMovies={nowPlayingMovies}
        userUpcomingEpisodes={upcomingEpisodes}
        locale={locale}
        userCountry={userCountry}
      />
    </div>
  );
}
