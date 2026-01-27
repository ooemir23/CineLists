import Image from "next/image";
import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { MediaFilter } from "@/components/home/media-filter";
import { Play, Info } from "lucide-react";
import { HomeSearchBar } from "@/components/home/home-search-bar";
import { PersonalizedRecommendations } from "@/components/home/personalized-recommendations";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { HeroSection } from "@/components/home/hero-section";
import { FriendsActivity } from "@/components/home/friends-activity";

export const revalidate = 3600; // Revalidate every hour

type HomeProps = {
  searchParams: Promise<{
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {

  const { type = "movie", year, rating, provider, genre } = await searchParams;
  const isFiltering = year || rating || provider || genre;
  let trendingMovies, trendingTV, popularMovies, upcomingMovies, popularTV, filterResults, personalizedMovies: any;
  let userName = "";
  if (isFiltering) {
    const params: Record<string, string> = {
      watch_region: "TR",
      sort_by: "popularity.desc",
    };
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
  } else {
    // Check for user session and preferences
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

  // Saat bazlı selamla fonksiyonu
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Günaydın";
    if (hour >= 12 && hour < 18) return "İyi Öğlenler";
    if (hour >= 18 && hour < 22) return "İyi Akşamlar";
    if (hour >= 22 || hour < 5) return "İyi Geceler";
    return "Merhaba";
  }

  return (
    // -mt-16 to pull the hero under the transparent/sticky header for immersive effect
    <div className="min-h-screen w-full overflow-x-hidden pb-20 -mt-16" style={{ backgroundColor: '#101624' }}>
      {/* Hero Section with Integrated Search */}
      <div className="relative">
        <HeroSection />

        {/* Search Bar integrated below Hero content or at a better offset */}
        <div className="absolute bottom-28 left-0 right-0 z-30 flex justify-center px-6">
          <div className="w-full max-w-lg backdrop-blur-xl bg-black/40 rounded-2xl shadow-2xl border border-white/10 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <HomeSearchBar />
          </div>
        </div>

        {/* Gradient transition to content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#101624] to-transparent z-20 pointer-events-none" />
      </div>

      {/* Filter Section - Adjusted margin to sit elegantly at the hero transition */}
      <div className="relative z-30 -mt-12 max-w-7xl mx-auto px-6 md:px-10 mb-12">
        <MediaFilter />
      </div>

      {/* Content Rows */}
      <div className="mt-8 relative z-10 max-w-7xl mx-auto px-6 md:px-10">
        {isFiltering ? (
          <MediaRow
            title="Arama Sonuçları"
            items={(filterResults?.results || []).slice(0, 6)}
            type={type as "movie" | "tv"}
          />
        ) : (
          <>
            {/* Ana Akım (Trend) Bölümü */}
            <div className="mb-0">

              {/* Friends Activity Feed */}
              <FriendsActivity />

              {personalizedMovies?.results?.length > 0 && (
                <PersonalizedRecommendations
                  results={personalizedMovies.results}
                  reasons={personalizedMovies.reasons}
                />
              )}

              <div className="mt-8">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-4">Ana Akım</h2>
                <MediaRow
                  title="Trend Filmler"
                  items={trendingMovies.results.slice(0, 6)}
                  type="movie"
                  href="/explore/movie/trending"
                />
                <MediaRow
                  title="Trend Diziler"
                  items={trendingTV.results.slice(0, 6)}
                  type="tv"
                  href="/explore/tv/trending"
                />
              </div>
            </div>

            {/* Popüler Olanlar Bölümü */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-4">Popüler Olanlar</h2>
              <MediaRow
                title="Popüler Filmler"
                items={popularMovies.results.slice(0, 6)}
                type="movie"
                href="/explore/movie/popular"
              />
              <MediaRow
                title="Popüler Diziler"
                items={popularTV.results.slice(0, 6)}
                type="tv"
                href="/explore/tv/popular"
              />
            </div>

            {/* Diğer bölümler */}
            <MediaRow
              title="Yakında Vizyona Girecekler"
              items={upcomingMovies.results.slice(0, 6)}
              type="movie"
              href="/explore/movie/upcoming"
            />
          </>
        )}
      </div>
    </div>
  );
}
