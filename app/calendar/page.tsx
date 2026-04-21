import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { tmdb } from "@/lib/tmdb";
import { Calendar, Film, Tv, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Yakında çıkacak filmler ve diziler
  const [upcomingMovies, upcomingTV, nowPlayingMovies] = await Promise.all([
    tmdb.discover("movie", {
      sort_by: "popularity.desc",
      "primary_release_date.gte": new Date().toISOString().split("T")[0],
      "vote_count.gte": "10",
    }),
    tmdb.discover("tv", {
      sort_by: "popularity.desc",
      "first_air_date.gte": new Date().toISOString().split("T")[0],
      "vote_count.gte": "10",
    }),
    tmdb.discover("movie", {
      sort_by: "primary_release_date.desc",
      "primary_release_date.lte": new Date().toISOString().split("T")[0],
      "vote_count.gte": "50",
    }),
  ]);

  const upcomingAll = [
    ...upcomingMovies.results.map((m: any) => ({ ...m, media_type: "movie" })),
    ...upcomingTV.results.map((t: any) => ({ ...t, media_type: "tv" })),
  ].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Yakında & Yeni Çıkanlar
          </h1>
        </div>
        <p className="text-neutral-500 text-xs md:text-sm font-medium pb-1 md:pb-1.5">
          Yakında çıkacak ve vizyondaki içerikleri keşfet.
        </p>
      </div>

      {/* Upcoming Section */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🚀</span> Yakında Gelecekler
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {upcomingAll.slice(0, 18).map((item: any) => (
            <Link
              key={item.id}
              href={`/${item.media_type === "movie" ? "movie" : "tv"}/${item.id}`}
              className="group"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 mb-2">
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                    alt={item.title || item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.media_type === "movie" ? (
                      <Film className="w-8 h-8 text-neutral-700" />
                    ) : (
                      <Tv className="w-8 h-8 text-neutral-700" />
                    )}
                  </div>
                )}
                {/* Date Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <span className="text-[10px] font-bold text-white">
                    {item.release_date || item.first_air_date
                      ? new Date(
                          item.release_date || item.first_air_date
                        ).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Tarih belirtilmedi"}
                  </span>
                </div>
                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.media_type === "movie"
                        ? "bg-blue-500/80 text-white"
                        : "bg-purple-500/80 text-white"
                    }`}
                  >
                    {item.media_type === "movie" ? "FİLM" : "DİZİ"}
                  </span>
                </div>
              </div>
              <h3 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                {item.title || item.name}
              </h3>
              {item.vote_average > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] text-neutral-400">
                    {item.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Now Playing Section */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🎬</span> Vizyondakiler
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {nowPlayingMovies.results.slice(0, 12).map((movie: any) => (
            <Link
              key={movie.id}
              href={`/movie/${movie.id}`}
              className="group"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 mb-2">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-8 h-8 text-neutral-700" />
                  </div>
                )}
                {movie.vote_average > 0 && (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                    <Star size={8} className="text-amber-400 fill-amber-400" />
                    <span className="text-[9px] font-bold text-white">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                {movie.title}
              </h3>
              {movie.release_date && (
                <span className="text-[10px] text-neutral-500">
                  {new Date(movie.release_date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
