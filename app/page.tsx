import Image from "next/image";
import Link from "next/link";
import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { Play, Info } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const [trendingMovies, trendingTV] = await Promise.all([
    tmdb.getTrendingMovies(),
    tmdb.getTrendingTV(),
  ]);

  const heroMovie = trendingMovies.results[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full">
        <div className="absolute inset-0">
          <Image
            src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`}
            alt={heroMovie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>

        <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-20 md:pb-24 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
            {heroMovie.title}
          </h1>
          <p className="text-neutral-300 text-sm md:text-lg line-clamp-3 mb-6 max-w-2xl drop-shadow-md">
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
              <Info className="w-5 h-5" />
              Daha Fazla
            </Link>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="-mt-20 relative z-10 space-y-8">
        <MediaRow title="Trend Filmler" items={trendingMovies.results} type="movie" />
        <MediaRow title="Popüler Diziler" items={trendingTV.results} type="tv" />
      </div>
    </div>
  );
}
