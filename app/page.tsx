import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { MediaFilter } from "@/components/home/media-filter";
import { Play, Info, ChevronRight } from "lucide-react";
import { HomeSearchBar } from "@/components/home/home-search-bar";
import { PersonalizedRecommendations } from "@/components/home/personalized-recommendations";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { FriendsActivity } from "@/components/home/friends-activity";
import { HomeTopSection } from "@/components/home/home-top-section";

export const revalidate = 3600; // Revalidate every hour

type HomeProps = {
  searchParams: Promise<{
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
    q?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {

  const { type = "", year, rating, provider, genre, q } = await searchParams;
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
          results: [...movieResults.results, ...tvResults.results].sort((a, b) =>
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
        filterResults = await tmdb.discover(type as "movie" | "tv", params);
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
    <div className="min-h-screen w-full overflow-x-hidden pb-20 bg-[#101624]">

      {/* Primary Top Section: Hero Slider & Friends Activity */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8 md:mb-12 pt-20 md:pt-24">
        {!isFiltering && <HomeTopSection />}
      </div>

      {/* Personalized Recommendations - Highlighted Placement */}
      {!isFiltering && personalizedMovies?.results?.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-12">
          <PersonalizedRecommendations
            results={personalizedMovies.results}
            reasons={personalizedMovies.reasons}
          />
        </div>
      )}

      {/* Filter Section - Compact & Sticky Support if needed */}
      <div className="relative z-30 max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8 md:mb-12">
        <MediaFilter />
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 space-y-12 md:space-y-16">

        {isFiltering ? (
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <MediaRow
              title={q ? `"${q}" için Arama Sonuçları` : "Arama Sonuçları"}
              items={(filterResults?.results || []).slice(0, 20)}
              type={(type || "movie") as "movie" | "tv"}
            />
          </div>
        ) : (
          <>
            {/* Trend & Popular Sections */}

            <section className="group">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <Link href="/explore/movie/trending" className="flex items-center gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-amber-400 rounded-full" />
                  <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                    Trend <span className="text-amber-400 group-hover:text-white">Filmler</span>
                  </h2>
                </Link>
                <Link href="/explore/movie/trending" className="text-xs md:text-sm font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                  Tümünü Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="-mx-4 md:mx-0">
                <MediaRow
                  title=""
                  items={trendingMovies.results.slice(0, 15)}
                  type="movie"
                  href="/explore/movie/trending"
                />
              </div>
            </section>

            <section className="group">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <Link href="/explore/tv/popular" className="flex items-center gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-primary rounded-full group-hover:bg-amber-400 transition-colors" />
                  <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                    Popüler <span className="text-primary group-hover:text-white">Diziler</span>
                  </h2>
                </Link>
                <Link href="/explore/tv/popular" className="text-xs md:text-sm font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                  Tümünü Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="-mx-4 md:mx-0">
                <MediaRow
                  title=""
                  items={popularTV.results.slice(0, 15)}
                  type="tv"
                  href="/explore/tv/popular"
                />
              </div>
            </section>

            <section className="group">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <Link href="/explore/tv/trending" className="flex items-center gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-amber-400 rounded-full" />
                  <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                    Yükselen <span className="text-amber-400 group-hover:text-white">Diziler</span>
                  </h2>
                </Link>
                <Link href="/explore/tv/trending" className="text-xs md:text-sm font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                  Tümünü Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="-mx-4 md:mx-0">
                <MediaRow
                  title=""
                  items={trendingTV.results.slice(0, 15)}
                  type="tv"
                  href="/explore/tv/trending"
                />
              </div>
            </section>

            <section className="group">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <Link href="/explore/movie/popular" className="flex items-center gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-primary rounded-full group-hover:bg-amber-400 transition-colors" />
                  <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                    Tüm Zamanların <span className="text-primary group-hover:text-white">Favori Filmleri</span>
                  </h2>
                </Link>
                <Link href="/explore/movie/popular" className="text-xs md:text-sm font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                  Tümünü Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="-mx-4 md:mx-0">
                <MediaRow
                  title=""
                  items={popularMovies.results.slice(0, 15)}
                  type="movie"
                  href="/explore/movie/popular"
                />
              </div>
            </section>

            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/5 p-4 md:p-8 group">
              <div className="flex items-center justify-between mb-6">
                <Link href="/explore/movie/upcoming" className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500 group-hover:text-black transition-all">
                    <Play size={20} className="text-blue-400 fill-current group-hover:text-black" />
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                    Yakında <span className="text-blue-400 group-hover:text-white">Vizyonda</span>
                  </h2>
                </Link>
                <Link href="/explore/movie/upcoming" className="text-xs md:text-sm font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                  Tümünü Gör <ChevronRight size={14} />
                </Link>
              </div>
              <div className="-mx-4 md:mx-0">
                <MediaRow
                  title=""
                  items={upcomingMovies.results.slice(0, 15)}
                  type="movie"
                  href="/explore/movie/upcoming"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
