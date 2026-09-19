import { tmdb } from "@/lib/tmdb";
import { Film } from "lucide-react";
import { MediaFilter } from "@/components/home/media-filter";
import {
  getUserRatingsBulk,
  getCommunityRatingsBulk,
} from "@/lib/rating-actions";
import { getMediaMetadataBulk } from "@/lib/activity-actions";
import { SearchResultsClient } from "@/components/search/search-results-client";
import { MediaRow } from "@/components/media/media-row";
import { DiscoveryEngine } from "@/components/search/discovery-engine";
import { getServerLocale } from "@/lib/i18n/server";
import { getServerCountry } from "@/lib/country";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
    country?: string;
    discoveryPeriod?: string;
    discoveryType?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const type = params.type || "";
  const year = params.year;
  const rating = params.rating;
  const provider = params.provider;
  const genre = params.genre;
  const userCountry = await getServerCountry();
  const country = params.country || userCountry;
  const locale = await getServerLocale();
  const tmdbLang = locale === "en" ? "en-US" : "tr-TR";
  const altLang = locale === "en" ? "tr-TR" : "en-US";

  const isFiltering = !!(query || year || rating || provider || genre || type);

  let results: any[] = [];

  // If there's a search query or filters, fetch results
  if (isFiltering) {
    const apiParams: Record<string, string> = {
      language: tmdbLang,
      watch_region: country,
    };

    if (query) {
      // Bilingual search: query both current language and alternate language (Turkish <-> English)
      const [primaryData, altData] = await Promise.all([
        tmdb.searchMulti(query, { language: tmdbLang }).catch(() => ({ results: [] })),
        tmdb.searchMulti(query, { language: altLang }).catch(() => ({ results: [] })),
      ]);

      const itemsMap = new Map<string, any>();
      for (const item of primaryData.results || []) {
        if (item.id && item.media_type) {
          itemsMap.set(`${item.media_type}:${item.id}`, item);
        }
      }
      for (const item of altData.results || []) {
        if (item.id && item.media_type) {
          const key = `${item.media_type}:${item.id}`;
          if (!itemsMap.has(key)) {
            itemsMap.set(key, item);
          }
        }
      }

      const merged = Array.from(itemsMap.values());
      results = type
        ? merged.filter((item: any) => item.media_type === type)
        : merged;
    } else {
      if (year) {
        apiParams[type === "tv" ? "first_air_date_year" : "primary_release_year"] = year;
      }
      if (rating) apiParams["vote_average.gte"] = rating;
      if (genre) apiParams["with_genres"] = genre;
      apiParams["sort_by"] = "popularity.desc";

      if (provider) {
        apiParams["with_watch_providers"] = provider.replace(/,/g, "|");
        apiParams["watch_region"] = country;
      } else {
        // When filtering by region without specific provider, ensure TMDB strictly
        // returns content available on streaming/digital platforms in that region.
        apiParams["watch_region"] = country;
        apiParams["with_watch_monetization_types"] = "flatrate|free|ads";
      }

      if (!type) {
        const tvParams = { ...apiParams };
        if (year) {
          delete tvParams["primary_release_year"];
          tvParams["first_air_date_year"] = year;
        }

        const [movieData, tvData] = await Promise.all([
          tmdb.discover("movie", apiParams),
          tmdb.discover("tv", tvParams),
        ]);

        results = [
          ...movieData.results.map((m: any) => ({ ...m, media_type: "movie" })),
          ...tvData.results.map((t: any) => ({ ...t, media_type: "tv" })),
        ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      } else {
        const data = await tmdb.discover(type as "movie" | "tv", apiParams);
        results = (data.results || []).map((item: any) => ({
          ...item,
          media_type: type,
        }));
      }
    }
  }

  const period =
    params.discoveryPeriod === "week" || params.discoveryPeriod === "month"
      ? params.discoveryPeriod
      : "day";
  const discoveryType = params.discoveryType === "tv" ? "tv" : "movie";

  // When not filtering, discover popular items available on platforms in the selected region (e.g. Turkey)
  let discoveryItems: any[] = [];
  if (!isFiltering) {
    const discoverParams: Record<string, string> = {
      language: tmdbLang,
      watch_region: country,
      with_watch_monetization_types: "flatrate|free|ads",
    };

    if (period === "day") {
      discoverParams["sort_by"] = "popularity.desc";
    } else if (period === "week") {
      discoverParams["sort_by"] = "popularity.desc";
    } else if (period === "month") {
      discoverParams["sort_by"] = "vote_average.desc";
      discoverParams["vote_count.gte"] = "150";
    }

    const data = await tmdb.discover(discoveryType, discoverParams);
    discoveryItems = (data.results || []).map((item: any) => ({
      ...item,
      media_type: discoveryType,
    })).slice(0, 20);
  }

  // Common metadata pre-fetching
  const people = results.filter(
    (item: any) => (item.media_type || type) === "person",
  );
  const mediaItems = results.filter(
    (item: any) => (item.media_type || item.type || type) !== "person",
  );

  const [userRatingsMap, communityRatingsMap, metadataMap] = await Promise.all([
    getUserRatingsBulk(mediaItems.map((m) => m.id)),
    getCommunityRatingsBulk(mediaItems.map((m) => m.id)),
    getMediaMetadataBulk(
      mediaItems.map((m) => ({
        id: m.id,
        type:
          m.media_type === "tv" || m.media_type === "movie"
            ? m.media_type
            : (type as "movie" | "tv"),
      })),
    ),
  ]);

  return (
    <div className="bg-background pb-20 pt-6 sm:pt-10 md:pt-12">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 mb-4">
        <MediaFilter />
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
        {!isFiltering ? (
          <DiscoveryEngine period={period} type={discoveryType}>
            <MediaRow
              title=""
              items={discoveryItems}
              type={discoveryType}
              countryCode={country}
            />
          </DiscoveryEngine>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10">
              <Film className="w-16 h-16 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Sonuç Bulunamadı
            </h2>
            <p className="text-neutral-400 max-w-md">
              Aradığınız kriterlere uygun içerik bulunamadı.
            </p>
          </div>
        ) : (
          <SearchResultsClient
            people={people}
            mediaItems={mediaItems}
            userRatingsMap={userRatingsMap}
            communityRatingsMap={communityRatingsMap}
            metadataMap={metadataMap}
            type={type}
            countryCode={country}
          />
        )}
      </div>
    </div>
  );
}
