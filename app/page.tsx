import Image from "next/image";
import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { MediaFilter } from "@/components/home/media-filter";
import { Play, Info } from "lucide-react";
import { HomeSearchBar } from "@/components/home/home-search-bar";

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
  let trendingMovies, trendingTV, popularMovies, upcomingMovies, popularTV, filterResults, personalizedMovies;
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
    const { prisma } = await import("@/lib/prisma");
    let personalizedPromise = Promise.resolve(null);
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { favoriteGenres: true, hasCompletedOnboarding: true }
      });
      if (dbUser?.favoriteGenres?.length && dbUser.favoriteGenres.length > 0) {
        personalizedPromise = tmdb.discover("movie", {
          with_genres: dbUser.favoriteGenres.join(","),
          sort_by: "popularity.desc",
          "vote_average.gte": "7.0"
        });
      }
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
    <div className="min-h-screen w-full overflow-x-hidden pb-20" style={{ backgroundColor: '#101624' }}>
      {/* Search Bar Only Section */}
      <div className="flex flex-col items-center justify-center h-[20vh] w-full pt-8 md:pt-16">
        <div className="w-full max-w-md">
          <HomeSearchBar />
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-10">
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
            {personalizedMovies?.results?.length > 0 && (
              <MediaRow
                title="Sizin İçin Önerilenler"
                items={personalizedMovies.results.slice(0, 6)}
                type="movie"
              />
            )}
            <MediaRow
              title="Trend Filmler"
              items={trendingMovies.results.slice(0, 6)}
              type="movie"
              href="/explore/movie/trending"
            />
            <MediaRow
              title="Popüler Filmler"
              items={popularMovies.results.slice(0, 6)}
              type="movie"
              href="/explore/movie/popular"
            />
            <MediaRow
              title="Yakında Vizyona Girecekler"
              items={upcomingMovies.results.slice(0, 6)}
              type="movie"
              href="/explore/movie/upcoming"
            />
            <MediaRow
              title="Popüler Diziler"
              items={popularTV.results.slice(0, 6)}
              type="tv"
              href="/explore/tv/popular"
            />
            <MediaRow
              title="Trend Diziler"
              items={trendingTV.results.slice(0, 6)}
              type="tv"
              href="/explore/tv/trending"
            />
          </>
        )}
      </div>
    </div>
  );
}
