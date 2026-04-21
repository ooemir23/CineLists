import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { ChevronRight } from "lucide-react";
import { PersonalizedRecommendations } from "@/components/home/personalized-recommendations";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { FriendsActivity } from "@/components/home/friends-activity";
import { HomeTopSection } from "@/components/home/home-top-section";
import { SectionTabs } from "@/components/home/section-tabs";

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
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-3 md:mt-4 space-y-3 md:space-y-5">

        {isFiltering ? (
          <div id="search-results" className="bg-white/5 rounded-2xl p-4 md:p-5 border border-white/10 scroll-mt-24">
            <MediaRow
              title={q ? `"${q}" için Arama Sonuçları` : "Arama Sonuçları"}
              items={(filterResults?.results || []).slice(0, 20)}
              type={(type || "movie") as "movie" | "tv"}
            />
          </div>
        ) : (
          <>
            {/* Consolidated Sections: Trendler & Popüler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Trendler Section with Amber Frame */}
              <section className="group relative p-3 md:p-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] hover:border-amber-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-500" />

                <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10 gap-2">
                  <Link
                    href={trType === "tv" ? "/explore/tv/trending" : "/explore/movie/trending"}
                    className="group/title flex items-center gap-2 overflow-hidden"
                  >
                    <div className="shrink-0">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em] block">Keşfedin</span>
                      <h2 className="text-lg md:text-2xl font-black text-white tracking-tight group-hover/title:text-amber-400 transition-colors truncate">
                        Trendler
                      </h2>
                    </div>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover/title:bg-amber-400 group-hover/title:text-black transition-all group-hover/title:translate-x-1 shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                  </Link>

                  <div className="shrink-0">
                    <SectionTabs paramName="trType" activeValue={trType} themeColor="amber" />
                  </div>
                </div>

                <div className="-mx-1 md:mx-0 relative z-10">
                  <MediaRow
                    title=""
                    items={[
                      ...(trType === "all" || trType === "movie" ? (trendingMovies?.results || []).map((m: any) => ({ ...m, media_type: "movie" })) : []),
                      ...(trType === "all" || trType === "tv" ? (trendingTV?.results || []).map((t: any) => ({ ...t, media_type: "tv" })) : [])
                    ].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)}
                    type="movie"
                  />
                </div>
              </section>

              {/* Popüler Section with Blue Frame */}
              <section className="group relative p-3 md:p-5 rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] hover:border-blue-500/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500" />

                <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10 gap-2">
                  <Link
                    href={poType === "tv" ? "/explore/tv/popular" : "/explore/movie/popular"}
                    className="group/title flex items-center gap-2 overflow-hidden"
                  >
                    <div className="shrink-0">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.15em] block">Öne Çıkan</span>
                      <h2 className="text-lg md:text-2xl font-black text-white tracking-tight group-hover/title:text-blue-400 transition-colors truncate">
                        Popüler
                      </h2>
                    </div>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover/title:bg-blue-400 group-hover/title:text-black transition-all group-hover/title:translate-x-1 shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                  </Link>

                  <div className="shrink-0">
                    <SectionTabs paramName="poType" activeValue={poType} themeColor="blue" />
                  </div>
                </div>

                <div className="-mx-1 md:mx-0 relative z-10">
                  <MediaRow
                    title=""
                    items={[
                      ...(poType === "all" || poType === "movie" ? (popularMovies?.results || []).map((m: any) => ({ ...m, media_type: "movie" })) : []),
                      ...(poType === "all" || poType === "tv" ? (popularTV?.results || []).map((t: any) => ({ ...t, media_type: "tv" })) : [])
                    ].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)}
                    type="movie"
                  />
                </div>
              </section>
            </div>

            {/* Yakında Çıkacak Section with Green Frame */}
            <section className="group relative p-3 md:p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] hover:border-emerald-500/20 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />

              <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10 gap-2">
                <Link
                  href="/explore/movie/upcoming"
                  className="group/title flex items-center gap-2 overflow-hidden"
                >
                  <div className="shrink-0">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.15em] block">Yeni Gelenler</span>
                    <h2 className="text-lg md:text-2xl font-black text-white tracking-tight group-hover/title:text-emerald-400 transition-colors truncate">
                      Yakında Çıkacak
                    </h2>
                  </div>
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover/title:bg-emerald-400 group-hover/title:text-black transition-all group-hover/title:translate-x-1 shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                </Link>
              </div>

              <div className="-mx-1 md:mx-0 relative z-10">
                <MediaRow
                  title=""
                  items={(upcomingMovies?.results || []).map((m: any) => ({ ...m, media_type: "movie" })).slice(0, 20)}
                  type="movie"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
