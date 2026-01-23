import Image from "next/image";
import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { MediaFilter } from "@/components/home/media-filter";
import { Play, Info } from "lucide-react";

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

  const heroMovie = trendingMovies?.results?.[0] || filterResults?.results?.[0];

  return (
    <div className="min-h-screen bg-background pb-20 w-full overflow-x-hidden">
      {/* Hero Section */}
      {heroMovie && (
        <div className="relative h-[70vh] w-full">
          <div className="absolute inset-0">
            <Image
              src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`}
              alt={heroMovie.title || heroMovie.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          </div>

          <div className="relative h-full flex flex-col justify-end pb-20 md:pb-24">
            <div className="max-w-7xl mx-auto w-full px-6 md:px-10">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg text-left">
                  {heroMovie.title || heroMovie.name}
                </h1>
                <p className="text-neutral-300 text-sm md:text-lg line-clamp-3 mb-6 max-w-2xl drop-shadow-md text-left">
                  {heroMovie.overview}
                </p>

                <div className="flex items-center gap-4">
                  <Link
                    href={`/movie/${heroMovie.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Hemen İzle
                  </Link>
                  <Link
                    href={`/movie/${heroMovie.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/30 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Daha Fazla
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <MediaFilter />
      </div>

      {/* Content Rows */}
      <div className="mt-8 relative z-10 space-y-12 max-w-7xl mx-auto px-6 md:px-10">
        {isFiltering ? (
          <MediaRow
            title="Arama Sonuçları"
            items={filterResults?.results || []}
            type={type as "movie" | "tv"}
          />
        ) : (
          <>
            {personalizedMovies?.results?.length > 0 && (
              <MediaRow
                title="Sizin İçin Önerilenler"
                items={personalizedMovies.results}
                type="movie"
              />
            )}
            <MediaRow
              title="Trend Filmler"
              items={trendingMovies.results}
              type="movie"
              href="/explore/movie/trending"
            />
            <MediaRow
              title="Popüler Filmler"
              items={popularMovies.results}
              type="movie"
              href="/explore/movie/popular"
            />
            <MediaRow
              title="Yakında Vizyona Girecekler"
              items={upcomingMovies.results}
              type="movie"
              href="/explore/movie/upcoming"
            />
            <MediaRow
              title="Popüler Diziler"
              items={popularTV.results}
              type="tv"
              href="/explore/tv/popular"
            />
            <MediaRow
              title="Trend Diziler"
              items={trendingTV.results}
              type="tv"
              href="/explore/tv/trending"
            />
          </>
        )}
      </div>
    </div>
  );
}
