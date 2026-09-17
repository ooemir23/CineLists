import Link from "next/link";
import { ArrowRight, Star, Clock, Calendar } from "lucide-react";
import { TmdbImage as Image } from "@/components/ui/tmdb-image";

export type MediaGridItem = {
  id: number;
  title: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  vote_count?: number;
};

type PortalNewsGridProps = {
  title: string;
  viewAllHref: string;
  featuredItems: MediaGridItem[];
  compactItems: MediaGridItem[];
};

export function PortalNewsGrid({
  title,
  viewAllHref,
  featuredItems,
  compactItems,
}: PortalNewsGridProps) {
  return (
    <section className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md">
      {/* Panel Head */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-xs font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors group"
        >
          Tümünü Gör
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 2-Column News Layout (Left: Grid of Cards, Right: Compact Side List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Featured Cards (Mobile swipeable carousel / Desktop 3-column grid) */}
        <div className="lg:col-span-8 flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-3.5 pb-2.5 sm:pb-0 scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid-cols-2 md:grid-cols-3">
          {featuredItems.slice(0, 6).map((item, idx) => {
            const year = (item.release_date || item.first_air_date || "").split("-")[0];
            const type = item.media_type || "movie";
            const imgPath = item.backdrop_path || item.poster_path;
            const imgUrl = imgPath
              ? `https://image.tmdb.org/t/p/w500${imgPath}`
              : "/placeholder.jpg";

            return (
              <article
                key={item.id}
                className="group flex flex-col w-[76vw] sm:w-auto shrink-0 snap-start rounded-xl overflow-hidden bg-slate-900/80 border border-white/5 hover:border-amber-400/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40"
              >
                {/* Visual Thumbnail with Badge */}
                <Link
                  href={`/${type}/${item.id}`}
                  className="relative aspect-video w-full overflow-hidden bg-slate-800 shrink-0"
                >
                  {imgPath ? (
                    <Image
                      src={imgUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                      Görsel Yok
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow">
                      Yeni
                    </span>
                  )}
                  {item.vote_average > 0 && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-950/80 border border-white/10 text-amber-400 flex items-center gap-1 backdrop-blur-sm">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </Link>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors leading-snug">
                    <Link href={`/${type}/${item.id}`}>{item.title}</Link>
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-400">
                    {year && <span>{year}</span>}
                    {year && <span>·</span>}
                    <span className="capitalize">{type === "movie" ? "Film" : "Dizi"}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right: Compact Side List (6-8 items) */}
        <div className="lg:col-span-4 flex flex-col divide-y divide-white/5 rounded-xl bg-white/[0.02] border border-white/5 p-2">
          {compactItems.slice(0, 8).map((item) => {
            const type = item.media_type || "movie";
            const thumbPath = item.poster_path || item.backdrop_path;
            const thumbUrl = thumbPath
              ? `https://image.tmdb.org/t/p/w185${thumbPath}`
              : "/placeholder.jpg";

            return (
              <Link
                key={item.id}
                href={`/${type}/${item.id}`}
                className="group flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* Mini Visual Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-white/10">
                  {thumbPath ? (
                    <Image
                      src={thumbUrl}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">
                      Yok
                    </div>
                  )}
                </div>

                {/* Compact Title & Meta */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-200 line-clamp-2 group-hover:text-amber-400 transition-colors leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                    <span className="capitalize">{type === "movie" ? "Film" : "Dizi"}</span>
                    {item.vote_average > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {item.vote_average.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
