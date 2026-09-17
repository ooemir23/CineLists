"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Film, Tv, Calendar } from "lucide-react";
import { TmdbImage as Image } from "@/components/ui/tmdb-image";
import { cn } from "@/lib/utils";

export type MediaGridProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

export type MediaGridItem = {
  id: number;
  title: string;
  overview?: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  vote_count?: number;
  providers?: MediaGridProvider[];
  rentBuyProviders?: MediaGridProvider[];
  inCinemas?: boolean;
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
  const [activeTab, setActiveTab] = useState<"featured" | "upcoming">("featured");

  const currentItems = activeTab === "featured" ? featuredItems : compactItems;

  return (
    <section className="p-4 sm:p-6 md:p-7 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md">
      {/* Panel Header with Tabs & View All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h2 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            {title}
          </h2>

          {/* Tab Switcher for Rich Presentation */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab("featured")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeTab === "featured"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Film className="w-3.5 h-3.5" />
              Vizyondakiler
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeTab === "upcoming"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              Yakında
            </button>
          </div>
        </div>

        <Link
          href={activeTab === "featured" ? viewAllHref : "/?category=upcoming"}
          className="text-xs sm:text-sm font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors group self-start sm:self-auto"
        >
          Tümünü Gör
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Spacious 3-Column Grid for Maximum Visual Impact & Readability */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-4 md:gap-5 pb-3 sm:pb-0 scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.slice(0, 6).map((item, idx) => {
          const year = (item.release_date || item.first_air_date || "").split("-")[0];
          const type = item.media_type || "movie";
          const imgPath = item.backdrop_path || item.poster_path;
          const imgUrl = imgPath
            ? `https://image.tmdb.org/t/p/w780${imgPath}`
            : "/placeholder.jpg";

          return (
            <article
              key={item.id}
              className="group flex flex-col w-[85vw] max-w-[340px] sm:max-w-none sm:w-auto shrink-0 snap-start rounded-2xl overflow-hidden bg-slate-900/80 border border-white/10 hover:border-amber-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
            >
              {/* Large, Cinematic Thumbnail (16:10 aspect ratio for extra height) */}
              <Link
                href={`/${type}/${item.id}`}
                className="relative aspect-[16/10] w-full overflow-hidden bg-slate-800 shrink-0"
              >
                {imgPath ? (
                  <Image
                    src={imgUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-500 font-semibold">
                    Görsel Yok
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Badge Top Left */}
                {idx === 0 && activeTab === "featured" ? (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                    Yeni
                  </span>
                ) : item.inCinemas ? (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-400/90 text-slate-950 shadow-md flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Vizyonda
                  </span>
                ) : null}

                {/* Rating Badge Bottom Right */}
                {item.vote_average > 0 && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-950/90 border border-white/15 text-amber-400 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {item.vote_average.toFixed(1)}
                  </span>
                )}
              </Link>

              {/* Large & Readable Content Block */}
              <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
                <div>
                  {/* Big Readable Title */}
                  <h3 className="text-base sm:text-[17px] font-extrabold text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-1" title={item.title}>
                    <Link href={`/${type}/${item.id}`}>{item.title}</Link>
                  </h3>

                  {/* Clean Meta Row */}
                  <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
                    {year && <span className="text-neutral-200 font-bold">{year}</span>}
                    {year && <span className="text-neutral-600">·</span>}
                    <span className="capitalize">{type === "movie" ? "Film" : "Dizi"}</span>
                  </div>

                  {/* Story Logline / Overview Snippet */}
                  {item.overview && (
                    <p className="mt-2 text-xs sm:text-[13px] text-neutral-400 line-clamp-2 leading-relaxed font-normal">
                      {item.overview}
                    </p>
                  )}
                </div>

                {/* Prominent Platform & Streaming Bar */}
                <div className="pt-3 mt-1 border-t border-white/10 flex items-center justify-between min-h-[32px]">
                  {item.providers && item.providers.length > 0 ? (
                    <div className="flex items-center gap-2 min-w-0" title={item.providers.map((p) => p.provider_name).join(", ")}>
                      <span className="text-xs text-neutral-400 font-semibold shrink-0">Yayın:</span>
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        {item.providers.slice(0, 3).map((p) => (
                          <div
                            key={p.provider_id}
                            className="relative w-6 h-6 rounded-md overflow-hidden border border-white/20 bg-slate-950 shadow-sm"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-200 truncate">
                        {item.providers[0]?.provider_name}
                        {item.providers.length > 1 ? ` +${item.providers.length - 1}` : ""}
                      </span>
                    </div>
                  ) : item.inCinemas ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                        <Film className="w-3.5 h-3.5 shrink-0" />
                        Sinemalarda
                      </span>
                    </div>
                  ) : item.rentBuyProviders && item.rentBuyProviders.length > 0 ? (
                    <div className="flex items-center gap-2 min-w-0" title={item.rentBuyProviders.map((p) => p.provider_name).join(", ")}>
                      <span className="text-xs text-neutral-400 font-semibold shrink-0">Kirala:</span>
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        {item.rentBuyProviders.slice(0, 2).map((p) => (
                          <div
                            key={p.provider_id}
                            className="relative w-6 h-6 rounded-md overflow-hidden border border-white/20 bg-slate-950 shadow-sm"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-200 truncate">
                        {item.rentBuyProviders[0]?.provider_name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                      <Tv className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>Dijitalde Yok</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
