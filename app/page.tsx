import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { ChevronRight } from "lucide-react";
import { PersonalizedRecommendations } from "@/components/home/personalized-recommendations";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { FriendsActivity } from "@/components/home/friends-activity";
import { HomeTopSection } from "@/components/home/home-top-section";
import { SectionTabs } from "@/components/home/section-tabs";
import { HomeDiscoverySection } from "@/components/home/home-discovery-section";

export const revalidate = 3600; // Revalidate every hour

type HomeProps = {
  searchParams: Promise<{
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
    q?: string;
    trType?: string;
    poType?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {

  const params = await searchParams;
  const { type = "", year, rating, provider, genre, q, trType = "all", poType = "all" } = params;
  const isFiltering = year || rating || provider || genre || type || q;
  let trendingMovies, trendingTV, popularMovies, upcomingMovies, popularTV, filterResults, personalizedMovies: any;
  let userName = "";

  if (isFiltering) {
    // If there's a search query, use search API
    if (q) {
      const data = await tmdb.searchMulti(q);
      // If type is specified, filter by type; otherwise show all
      const allResults = type
        ? (data.results || []).filter((item: any) => item.media_type === type)
        : (data.results || []);

      filterResults = {
        results: allResults,
        total_pages: data.total_pages || 1,
        total_results: data.total_results || allResults.length,
      };
    } else {
      // No search query, use discover with filters
      const params: Record<string, string> = {
        watch_region: "TR",
        sort_by: "popularity.desc",
      };

      // If type is empty, fetch both movies and TV shows
      if (!type) {
        if (year) {
          // For combined search, we'll use movie year format
          params["primary_release_year"] = year;
        }
        if (rating) params["vote_average.gte"] = rating;
        if (provider) {
          params["with_watch_providers"] = provider;
          params["watch_region"] = "TR";
        }
        if (genre) params["with_genres"] = genre;

        // Fetch both movies and TV shows
        const tvParams = { ...params };
        delete tvParams["primary_release_year"];
        if (year) {
          tvParams["first_air_date_year"] = year;
        }

        const [movieResults, tvResults] = await Promise.all([
          tmdb.discover("movie", params),
          tmdb.discover("tv", tvParams),
        ]);

        // Combine and sort by popularity
        filterResults = {
          results: [
            ...movieResults.results.map((m: any) => ({ ...m, media_type: "movie" })),
            ...tvResults.results.map((t: any) => ({ ...t, media_type: "tv" }))
          ].sort((a, b) =>
            (b.popularity || 0) - (a.popularity || 0)
          ),
          total_pages: Math.max(movieResults.total_pages, tvResults.total_pages),
          total_results: movieResults.total_results + tvResults.total_results,
        };
      } else {
        // Single type search
        if (year) {
          const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
          params[yearKey] = year;
        }
        if (rating) params["vote_average.gte"] = rating;
        if (provider) {
          params["with_watch_providers"] = provider;
          params["watch_region"] = "TR";
        }
        if (genre) params["with_genres"] = genre;
        const data = await tmdb.discover(type as "movie" | "tv", params);
        filterResults = {
          ...data,
          results: data.results.map((item: any) => ({ ...item, media_type: type }))
        };
      }
    }
  } else {
    const { auth } = await import("@/auth");
    const session = await auth();
    userName = session?.user?.name || "";

    let personalizedPromise: Promise<any> = Promise.resolve(null);
    if (session?.user?.id) {
      personalizedPromise = getPersonalizedRecommendations(session.user.id);
    }

    [trendingMovies, trendingTV, popularMovies, upcomingMovies, popularTV, personalizedMovies] = await Promise.all([
      tmdb.getTrendingMovies(),
      tmdb.getTrendingTV(),
      tmdb.getPopular("movie"),
      tmdb.getUpcomingMovies(),
      tmdb.getPopular("tv"),
      personalizedPromise
    ]);
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-24 md:pb-0 bg-[#101624]">

      {/* Primary Top Section: Hero Slider & Friends Activity */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 pt-2 md:pt-4">
        {!isFiltering && <HomeTopSection />}
      </div>

      {!isFiltering && <HomeDiscoverySection />}

      {/* Personalized Recommendations - Highlighted Placement */}
      {!isFiltering && personalizedMovies?.results?.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-3 md:mt-4">
          <PersonalizedRecommendations
            results={personalizedMovies.results}
            reasons={personalizedMovies.reasons}
          />
        </div>
      )}


      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-3 md:mt-4 space-y-2 md:space-y-3">

        {isFiltering && (
          <div id="search-results" className="bg-white/5 rounded-2xl p-4 md:p-5 border border-white/10 scroll-mt-24">
            <MediaRow
              title={q ? `"${q}" için Arama Sonuçları` : "Arama Sonuçları"}
              items={(filterResults?.results || []).slice(0, 20)}
              type={(type || "movie") as "movie" | "tv"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
