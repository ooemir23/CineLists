import Link from "next/link";
import { ArrowRight, Film, Tv, Star, Calendar } from "lucide-react";
import { TmdbImage as Image } from "@/components/ui/tmdb-image";
import { MediaGridItem } from "./portal-news-grid";

type PortalTwoPanelsProps = {
  movieFeature: MediaGridItem;
  movieList: MediaGridItem[];
  tvFeature: MediaGridItem;
  tvList: MediaGridItem[];
};

export function PortalTwoPanels({
  movieFeature,
  movieList,
  tvFeature,
  tvList,
}: PortalTwoPanelsProps) {
  const movieImg = movieFeature?.backdrop_path || movieFeature?.poster_path;
  const movieUrl = movieImg ? `https://image.tmdb.org/t/p/w780${movieImg}` : "/placeholder.jpg";

  const tvImg = tvFeature?.backdrop_path || tvFeature?.poster_path;
  const tvUrl = tvImg ? `https://image.tmdb.org/t/p/w780${tvImg}` : "/placeholder.jpg";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
      {/* Panel 1: Sinema & Vizyon */}
      {movieFeature && (
        <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                Sinema & Vizyon
              </h2>
              <Link
                href="/?type=movie"
                className="text-xs font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors group"
              >
                Tümü
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Featured Hero Card */}
            <Link
              href={`/movie/${movieFeature.id}`}
              className="group block relative aspect-video w-full rounded-xl overflow-hidden bg-slate-800 border border-white/10 shadow-lg"
            >
              {movieImg ? (
                <Image
                  src={movieUrl}
                  alt={movieFeature.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm inline-block mb-2">
                  Öne Çıkan Film
                </span>
                <strong className="block text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {movieFeature.title}
                </strong>
                <div className="mt-1.5 flex items-center gap-3 text-xs sm:text-sm text-neutral-300 font-semibold">
                  {movieFeature.release_date && (
                    <span>{movieFeature.release_date.split("-")[0]}</span>
                  )}
                  {movieFeature.vote_average > 0 && (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      ★ {movieFeature.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* List items below feature */}
          <div className="mt-3.5 divide-y divide-white/5">
            {movieList.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/movie/${item.id}`}
                className="group flex items-center justify-between py-3 px-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <strong className="text-sm font-bold text-neutral-200 group-hover:text-amber-400 transition-colors line-clamp-1 flex-1 pr-3">
                  {item.title}
                </strong>
                <span className="text-xs font-bold text-neutral-300 shrink-0">
                  {item.vote_average > 0 ? `★ ${item.vote_average.toFixed(1)}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Panel 2: Trend Diziler */}
      {tvFeature && (
        <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <Tv className="w-4 h-4 text-sky-400" />
                Dizi Dünyası
              </h2>
              <Link
                href="/?type=tv"
                className="text-xs font-bold text-neutral-400 hover:text-sky-400 flex items-center gap-1 transition-colors group"
              >
                Tümü
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Featured Hero Card */}
            <Link
              href={`/tv/${tvFeature.id}`}
              className="group block relative aspect-video w-full rounded-xl overflow-hidden bg-slate-800 border border-white/10 shadow-lg"
            >
              {tvImg ? (
                <Image
                  src={tvUrl}
                  alt={tvFeature.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider bg-sky-500 text-slate-950 shadow-sm inline-block mb-2">
                  Popüler Dizi
                </span>
                <strong className="block text-base sm:text-lg font-black text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                  {tvFeature.title}
                </strong>
                <div className="mt-1.5 flex items-center gap-3 text-xs sm:text-sm text-neutral-300 font-semibold">
                  {tvFeature.first_air_date && (
                    <span>{tvFeature.first_air_date.split("-")[0]}</span>
                  )}
                  {tvFeature.vote_average > 0 && (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      ★ {tvFeature.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* List items below feature */}
          <div className="mt-3.5 divide-y divide-white/5">
            {tvList.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/tv/${item.id}`}
                className="group flex items-center justify-between py-3 px-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <strong className="text-sm font-bold text-neutral-200 group-hover:text-sky-400 transition-colors line-clamp-1 flex-1 pr-3">
                  {item.title}
                </strong>
                <span className="text-xs font-bold text-neutral-300 shrink-0">
                  {item.vote_average > 0 ? `★ ${item.vote_average.toFixed(1)}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
