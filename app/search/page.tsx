import { tmdb } from "@/lib/tmdb";
import { Film } from "lucide-react";
import { MediaFilter } from "@/components/home/media-filter";
import { getUserRatingsBulk, getCommunityRatingsBulk } from "@/lib/rating-actions";
import { getMediaMetadataBulk } from "@/lib/activity-actions";
import { SearchResultsClient } from "@/components/search/search-results-client";
import { MediaRow } from "@/components/media/media-row";
import { DiscoveryEngine } from "@/components/search/discovery-engine";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const type = params.type || "";
  const year = params.year;
  const rating = params.rating;
  const provider = params.provider;
  const genre = params.genre;

  const isFiltering = !!(query || year || rating || provider || genre || type);

  let results: any[] = [];

  // If there's a search query or filters, fetch results
  if (isFiltering) {
    const apiParams: Record<string, string> = {
      language: "tr-TR",
      watch_region: "TR",
    };

    if (query) {
      const data = await tmdb.searchMulti(query);
      results = type
        ? (data.results || []).filter((item: any) => item.media_type === type)
        : (data.results || []);
    } else {
      if (!type) {
        if (year) apiParams["primary_release_year"] = year;
        if (rating) apiParams["vote_average.gte"] = rating;
        if (provider) {
          apiParams["with_watch_providers"] = provider;
          apiParams["watch_region"] = "TR";
        }
        if (genre) apiParams["with_genres"] = genre;
        apiParams["sort_by"] = "popularity.desc";

        const tvParams = { ...apiParams };
        delete tvParams["primary_release_year"];
        if (year) tvParams["first_air_date_year"] = year;

        const [movieData, tvData] = await Promise.all([
          tmdb.discover("movie", apiParams),
          tmdb.discover("tv", tvParams),
        ]);

        results = [
          ...movieData.results.map((m: any) => ({ ...m, media_type: "movie" })),
          ...tvData.results.map((t: any) => ({ ...t, media_type: "tv" }))
        ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      } else {
        if (year) {
          const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
          apiParams[yearKey] = year;
        }
        if (rating) apiParams["vote_average.gte"] = rating;
        if (provider) {
          apiParams["with_watch_providers"] = provider;
          apiParams["watch_region"] = "TR";
        }
        if (genre) apiParams["with_genres"] = genre;
        apiParams["sort_by"] = "popularity.desc";
        const data = await tmdb.discover(type as "movie" | "tv", apiParams);
        results = (data.results || []).map((item: any) => ({ ...item, media_type: type }));
      }
    }
  }

  // Pre-fetch trending data if not filtering
  let trendingData: any = {};
  if (!isFiltering) {
    const [
      trendingDayMovie,
      trendingDayTV,
      trendingWeekMovie,
      trendingWeekTV,
      popularMovie,
      popularTV
    ] = await Promise.all([
      tmdb.getTrending("movie", "day"),
      tmdb.getTrending("tv", "day"),
      tmdb.getTrending("movie", "week"),
      tmdb.getTrending("tv", "week"),
      tmdb.getPopular("movie"),
      tmdb.getPopular("tv")
    ]);

    trendingData = {
      day: {
        movie: trendingDayMovie.results.slice(0, 15),
        tv: trendingDayTV.results.slice(0, 15)
      },
      week: {
        movie: trendingWeekMovie.results.slice(0, 15),
        tv: trendingWeekTV.results.slice(0, 15)
      },
      month: {
        movie: popularMovie.results.slice(0, 15),
        tv: popularTV.results.slice(0, 15)
      }
    };
  }

  // Common metadata pre-fetching
  const people = results.filter((item: any) => (item.media_type || type) === "person");
  const mediaItems = results.filter((item: any) => (item.media_type || item.type || type) !== "person");

  const [userRatingsMap, communityRatingsMap, metadataMap] = await Promise.all([
    getUserRatingsBulk(mediaItems.map(m => m.id)),
    getCommunityRatingsBulk(mediaItems.map(m => m.id)),
    getMediaMetadataBulk(mediaItems.map(m => ({
      id: m.id,
      type: (m.media_type === "tv" || m.media_type === "movie") ? m.media_type : (type as "movie" | "tv")
    })))
  ]);

  return (
    <div className="bg-background pb-20 pt-6 sm:pt-10 md:pt-12">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 mb-4">
        <MediaFilter />
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
        {!isFiltering ? (
          <DiscoveryEngine
            dayMovie={<MediaRow title="" items={trendingData.day.movie} type="movie" />}
            dayTV={<MediaRow title="" items={trendingData.day.tv} type="tv" />}
            weekMovie={<MediaRow title="" items={trendingData.week.movie} type="movie" />}
            weekTV={<MediaRow title="" items={trendingData.week.tv} type="tv" />}
            monthMovie={<MediaRow title="" items={trendingData.month.movie} type="movie" />}
            monthTV={<MediaRow title="" items={trendingData.month.tv} type="tv" />}
          />
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10">
              <Film className="w-16 h-16 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Sonuç Bulunamadı</h2>
            <p className="text-neutral-400 max-w-md">Aradığınız kriterlere uygun içerik bulunamadı.</p>
          </div>
        ) : (
          <SearchResultsClient
            people={people}
            mediaItems={mediaItems}
            userRatingsMap={userRatingsMap}
            communityRatingsMap={communityRatingsMap}
            metadataMap={metadataMap}
            type={type}
          />
        )}
      </div>
    </div>
  );
}
