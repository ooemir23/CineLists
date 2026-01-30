import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { Play, Info, ChevronRight } from "lucide-react";
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


      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 space-y-12 md:space-y-16">

        {isFiltering ? (
          <div id="search-results" className="bg-white/5 rounded-3xl p-6 border border-white/10 scroll-mt-24">
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
              <div className="flex items-end justify-between mb-8">
                <Link href="/explore/movie/trending" className="group/title">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 block">Keşfedin</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover/title:text-amber-400 transition-colors">
                    Trend <span className="text-neutral-500 group-hover/title:text-white transition-colors">Filmler</span>
                  </h2>
                </Link>
                <Link href="/explore/movie/trending" className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all pb-1 border-b border-transparent hover:border-white">
                  Tümünü Gör
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
              <div className="flex items-end justify-between mb-8">
                <Link href="/explore/tv/popular" className="group/title">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Öne Çıkan</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover/title:text-primary transition-colors">
                    Popüler <span className="text-neutral-500 group-hover/title:text-white transition-colors">Diziler</span>
                  </h2>
                </Link>
                <Link href="/explore/tv/popular" className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all pb-1 border-b border-transparent hover:border-white">
                  Tümünü Gör
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
              <div className="flex items-end justify-between mb-8">
                <Link href="/explore/tv/trending" className="group/title">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 block">İlgi Gören</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover/title:text-amber-400 transition-colors">
                    Yükselen <span className="text-neutral-500 group-hover/title:text-white transition-colors">Diziler</span>
                  </h2>
                </Link>
                <Link href="/explore/tv/trending" className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all pb-1 border-b border-transparent hover:border-white">
                  Tümünü Gör
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
              <div className="flex items-end justify-between mb-8">
                <Link href="/explore/movie/popular" className="group/title">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Koleksiyon</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover/title:text-primary transition-colors">
                    Favori <span className="text-neutral-500 group-hover/title:text-white transition-colors">Filmler</span>
                  </h2>
                </Link>
                <Link href="/explore/movie/popular" className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all pb-1 border-b border-transparent hover:border-white">
                  Tümünü Gör
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

            <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-900/10 via-transparent to-transparent border border-white/5 p-8 md:p-12 group">
              <div className="flex items-end justify-between mb-10">
                <Link href="/explore/movie/upcoming" className="group/title">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2 block">Gelecek</span>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight group-hover/title:text-blue-400 transition-colors italic uppercase">
                    Yakında <br />
                    <span className="text-blue-400 group-hover/title:text-white transition-colors">Vizyonda</span>
                  </h2>
                </Link>
                <Link href="/explore/movie/upcoming" className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-all pb-1 border-b border-transparent hover:border-white">
                  Tüm Listeyi Gör
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
