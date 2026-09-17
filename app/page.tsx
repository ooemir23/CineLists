import { Suspense } from "react";
import { auth } from "@/auth";
import { tmdb } from "@/lib/tmdb";
import { PortalHero, PortalHeroItem } from "@/components/portal/portal-hero";
import { PortalNewsGrid, MediaGridItem } from "@/components/portal/portal-news-grid";
import { PortalHomeFeed } from "@/components/portal/portal-home-feed";
import { PortalTwoPanels } from "@/components/portal/portal-two-panels";
import { PortalCommunityPulse } from "@/components/portal/portal-community-pulse";
import { PortalHubStrip } from "@/components/portal/portal-hub-strip";
import {
  PortalRightRail,
  TrendingTopicItem,
  ReviewRecommendationItem,
} from "@/components/portal/portal-right-rail";
import { MediaCard } from "@/components/media/media-card";
import { getHomeFeedActivities } from "@/lib/feed-actions";
import { cachedGetWatchProviders } from "@/lib/watch-provider-cache";
import { Film, Filter, X } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

type HomeProps = {
  searchParams: Promise<{
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
    q?: string;
    category?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const { type = "", year, rating, provider, genre, q, category } = params;
  const isFiltering = Boolean(year || rating || provider || genre || type || q || category);
  const session = await auth();

  let filterResults: any = null;

  if (isFiltering) {
    if (q) {
      const data = await tmdb.searchMulti(q);
      const allResults = type
        ? (data.results || []).filter((item: any) => item.media_type === type)
        : data.results || [];

      filterResults = {
        results: allResults,
        total_pages: data.total_pages || 1,
        total_results: data.total_results || allResults.length,
      };
    } else if (category === "top_rated") {
      const targetType = (type || "movie") as "movie" | "tv";
      const data = await tmdb.getTopRated(targetType);
      filterResults = {
        results: (data.results || []).map((item: any) => ({
          ...item,
          media_type: targetType,
        })),
        total_pages: data.total_pages || 1,
        total_results: data.total_results || (data.results || []).length,
      };
    } else {
      const discoverParams: Record<string, string> = {
        watch_region: "TR",
        sort_by: "popularity.desc",
      };

      if (!type) {
        if (year) discoverParams["primary_release_year"] = year;
        if (rating) discoverParams["vote_average.gte"] = rating;
        if (provider) {
          discoverParams["with_watch_providers"] = provider;
          discoverParams["watch_region"] = "TR";
        }
        if (genre) discoverParams["with_genres"] = genre;

        const tvParams = { ...discoverParams };
        delete tvParams["primary_release_year"];
        if (year) tvParams["first_air_date_year"] = year;

        const [movieResults, tvResults] = await Promise.all([
          tmdb.discover("movie", discoverParams),
          tmdb.discover("tv", tvParams),
        ]);

        filterResults = {
          results: [
            ...(movieResults?.results || []).map((m: any) => ({
              ...m,
              media_type: "movie",
            })),
            ...(tvResults?.results || []).map((t: any) => ({
              ...t,
              media_type: "tv",
            })),
          ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
          total_pages: Math.max(movieResults?.total_pages || 1, tvResults?.total_pages || 1),
          total_results: (movieResults?.total_results || 0) + (tvResults?.total_results || 0),
        };
      } else {
        if (year) {
          const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
          discoverParams[yearKey] = year;
        }
        if (rating) discoverParams["vote_average.gte"] = rating;
        if (provider) {
          discoverParams["with_watch_providers"] = provider;
          discoverParams["watch_region"] = "TR";
        }
        if (genre) discoverParams["with_genres"] = genre;

        const data = await tmdb.discover(type as "movie" | "tv", discoverParams);
        filterResults = {
          ...data,
          results: (data?.results || []).map((item: any) => ({
            ...item,
            media_type: type,
          })),
        };
      }
    }
  }

  // If filtering, render the filtered results cleanly with clear option
  if (isFiltering) {
    const filterTitle = q
      ? `"${q}" için arama sonuçları`
      : category === "top_rated"
      ? "En İyiler & Yüksek Puanlılar"
      : type === "movie"
      ? "Vizyondaki Filmler"
      : type === "tv"
      ? "Popüler Diziler"
      : "Filtrelenmiş Sonuçlar";

    const rawItems = filterResults?.results || [];
    const items = await Promise.all(
      rawItems.slice(0, 36).map(async (item: any) => {
        const itemType = (item.media_type || type || "movie") as "movie" | "tv";
        try {
          const providerData = await cachedGetWatchProviders(itemType, item.id.toString());
          const trProviders = providerData?.results?.TR?.flatrate;
          return {
            ...item,
            media_type: itemType,
            watch_providers: trProviders?.length ? { flatrate: trProviders.slice(0, 5) } : null,
          };
        } catch {
          return { ...item, media_type: itemType, watch_providers: null };
        }
      })
    );

    return (
      <div className="w-full px-3 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {filterTitle}
              </h1>
              <p className="text-xs text-neutral-400 font-medium">
                {items.length} içerik listeleniyor
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-bold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Filtreleri Temizle
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {items.map((item: any) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                id={item.id}
                title={item.title || item.name}
                posterPath={item.poster_path}
                voteAverage={item.vote_average || 0}
                type={item.media_type || "movie"}
                releaseDate={item.release_date || item.first_air_date}
                watchProviders={item.watch_providers}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              Sonuç bulunamadı
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
              Seçtiğiniz kriterlere uygun içerik bulunamadı. Filtreleri temizleyerek tekrar deneyebilirsiniz.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Default Portal Homepage: Fetch rich parallel data from TMDB
  const [
    trendingMovies,
    trendingTV,
    nowPlayingMovies,
    upcomingMovies,
    topRatedMovies,
    popularMovies,
    feedActivities,
  ] = await Promise.all([
    tmdb.getTrendingMovies().catch(() => ({ results: [] })),
    tmdb.getTrendingTV().catch(() => ({ results: [] })),
    tmdb.getNowPlayingMovies().catch(() => ({ results: [] })),
    tmdb.getUpcomingMovies().catch(() => ({ results: [] })),
    tmdb.getTopRated("movie").catch(() => ({ results: [] })),
    tmdb.getPopular("movie").catch(() => ({ results: [] })),
    getHomeFeedActivities(session?.user?.id).catch(() => []),
  ]);

  // 1. Hero Items (Merlin'in Kazanı large featured slider)
  const heroList: PortalHeroItem[] = [
    ...(trendingMovies?.results || []).slice(0, 3).map((item: any) => ({
      id: item.id,
      title: item.title || item.name || "",
      overview: item.overview || "",
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average || 0,
      media_type: "movie" as const,
      release_date: item.release_date,
      vote_count: item.vote_count,
    })),
    ...(trendingTV?.results || []).slice(0, 2).map((item: any) => ({
      id: item.id,
      title: item.name || item.title || "",
      overview: item.overview || "",
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average || 0,
      media_type: "tv" as const,
      first_air_date: item.first_air_date,
      vote_count: item.vote_count,
    })),
  ].filter((item) => Boolean(item.backdrop_path));

  // 2. News / Media Grid (Left 6 visual cards + Right 6 compact list items)
  const rawFeatured = (
    nowPlayingMovies?.results?.length
      ? nowPlayingMovies.results
      : trendingMovies?.results || []
  ).slice(0, 6);

  const rawCompact = (
    upcomingMovies?.results?.length
      ? upcomingMovies.results
      : trendingTV?.results || []
  ).slice(0, 6);

  const [featuredGridItems, compactNewsItems]: [MediaGridItem[], MediaGridItem[]] = await Promise.all([
    Promise.all(
      rawFeatured.map(async (item: any) => {
        const type = (item.title ? "movie" : "tv") as "movie" | "tv";
        const providersData = await cachedGetWatchProviders(type, item.id.toString()).catch(() => null);
        const trData = providersData?.results?.TR;
        const flatrate = (trData?.flatrate || []).map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        }));
        const rentBuy = [...(trData?.rent || []), ...(trData?.buy || [])].map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        }));

        const releaseTime = item.release_date ? new Date(item.release_date).getTime() : 0;
        const now = Date.now();
        const isTheatrical =
          type === "movie" &&
          (nowPlayingMovies?.results?.some((m: any) => m.id === item.id) ||
            (releaseTime > 0 && Math.abs(now - releaseTime) < 120 * 86400 * 1000));

        return {
          id: item.id,
          title: item.title || item.name || "",
          overview: item.overview || "",
          backdrop_path: item.backdrop_path,
          poster_path: item.poster_path,
          vote_average: item.vote_average || 0,
          release_date: item.release_date,
          media_type: type,
          providers: flatrate,
          rentBuyProviders: rentBuy.slice(0, 2),
          inCinemas: flatrate.length === 0 && Boolean(isTheatrical),
        };
      })
    ),
    Promise.all(
      rawCompact.map(async (item: any) => {
        const type = (item.title ? "movie" : "tv") as "movie" | "tv";
        const providersData = await cachedGetWatchProviders(type, item.id.toString()).catch(() => null);
        const trData = providersData?.results?.TR;
        const flatrate = (trData?.flatrate || []).map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        }));

        return {
          id: item.id,
          title: item.title || item.name || "",
          overview: item.overview || "",
          backdrop_path: item.backdrop_path,
          poster_path: item.poster_path,
          vote_average: item.vote_average || 0,
          release_date: item.release_date || item.first_air_date,
          media_type: type,
          providers: flatrate,
          inCinemas: flatrate.length === 0 && type === "movie",
        };
      })
    ),
  ]);

  // 3. Two-Panels Data
  const popMovies = popularMovies?.results || [];
  const movieFeature: MediaGridItem = popMovies[0]
    ? {
        id: popMovies[0].id,
        title: popMovies[0].title || popMovies[0].name,
        backdrop_path: popMovies[0].backdrop_path,
        poster_path: popMovies[0].poster_path,
        vote_average: popMovies[0].vote_average || 0,
        release_date: popMovies[0].release_date,
        media_type: "movie",
      }
    : featuredGridItems[0];

  const movieList: MediaGridItem[] = popMovies.slice(1, 4).map((item: any) => ({
    id: item.id,
    title: item.title || item.name,
    backdrop_path: item.backdrop_path,
    poster_path: item.poster_path,
    vote_average: item.vote_average || 0,
    release_date: item.release_date,
    media_type: "movie",
  }));

  const popTv = trendingTV?.results || [];
  const tvFeature: MediaGridItem = popTv[0]
    ? {
        id: popTv[0].id,
        title: popTv[0].name || popTv[0].title,
        backdrop_path: popTv[0].backdrop_path,
        poster_path: popTv[0].poster_path,
        vote_average: popTv[0].vote_average || 0,
        first_air_date: popTv[0].first_air_date,
        media_type: "tv",
      }
    : compactNewsItems[0];

  const tvList: MediaGridItem[] = popTv.slice(1, 4).map((item: any) => ({
    id: item.id,
    title: item.name || item.title,
    backdrop_path: item.backdrop_path,
    poster_path: item.poster_path,
    vote_average: item.vote_average || 0,
    first_air_date: item.first_air_date,
    media_type: "tv",
  }));

  // 4. Right Rail: Trending Topics (Heat 1..7)
  const combinedTrending = [
    ...(trendingMovies?.results || []).slice(0, 4),
    ...(trendingTV?.results || []).slice(0, 3),
  ];

  const heatLevels: Array<{
    heat: number;
    status: "Çok sıcak" | "Sıcak" | "Yükseliyor" | "Yeni";
  }> = [
    { heat: 100, status: "Çok sıcak" },
    { heat: 85, status: "Çok sıcak" },
    { heat: 72, status: "Sıcak" },
    { heat: 60, status: "Sıcak" },
    { heat: 48, status: "Yükseliyor" },
    { heat: 38, status: "Yeni" },
    { heat: 30, status: "Yeni" },
  ];

  const trendingTopics: TrendingTopicItem[] = combinedTrending
    .slice(0, 7)
    .map((item: any, idx) => ({
      id: item.id,
      rank: idx + 1,
      title: item.title || item.name || "",
      heat: heatLevels[idx]?.heat || 50,
      heatStatus: heatLevels[idx]?.status || "Sıcak",
      media_type: (item.title ? "movie" : "tv") as "movie" | "tv",
    }));

  // 5. Right Rail: "Ne İzleyebiliriz?" Puanlı Öneriler
  const recommendations: ReviewRecommendationItem[] = (
    topRatedMovies?.results || []
  )
    .slice(0, 5)
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name || "",
      poster_path: item.poster_path,
      score: Math.round((item.vote_average || 0) * 10),
      category: "Kritik & Seyirci Puanı",
      media_type: "movie",
    }));

  return (
    <div className="w-full px-3 sm:px-6 py-5 max-w-[1600px] mx-auto space-y-6">
      {/* Merlin'in Kazanı style Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Column (~%72 / 8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Hero Slider Feature */}
          <Suspense
            fallback={
              <div className="aspect-[16/9] w-full rounded-3xl bg-white/5 animate-pulse" />
            }
          >
            <PortalHero items={heroList} />
          </Suspense>

          {/* Son Vizyondakiler / Haber Izgarası */}
          <PortalNewsGrid
            title="Vizyondakiler & Son Eklenenler"
            viewAllHref="/?type=movie"
            featuredItems={featuredGridItems}
            compactItems={compactNewsItems}
          />

          {/* Canlı Akış & Topluluk / Arkadaş Aktiviteleri */}
          <PortalHomeFeed
            activities={feedActivities}
            user={session?.user}
          />

          {/* İkili Panel (Sinema / TV Dünyası) */}
          <PortalTwoPanels
            movieFeature={movieFeature}
            movieList={movieList}
            tvFeature={tvFeature}
            tvList={tvList}
          />

          {/* CineLists Nabzı (Kazan Kaynıyor) */}
          <PortalCommunityPulse
            focusTitle={heroList[0]?.title || "Dune: Part Two"}
            focusId={heroList[0]?.id || 693134}
            focusType={heroList[0]?.media_type || "movie"}
          />

          {/* Platform Hub'ları */}
          <PortalHubStrip />
        </div>

        {/* Right Rail (~%28 / 4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-5">
          <PortalRightRail
            trendingTopics={trendingTopics}
            recommendations={recommendations}
          />
        </div>
      </div>
    </div>
  );
}
