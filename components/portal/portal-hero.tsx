"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Calendar, MessageSquare, Play } from "lucide-react";
import { TmdbImage as Image } from "@/components/ui/tmdb-image";

export type PortalHeroItem = {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  vote_average: number;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  genre_names?: string[];
  vote_count?: number;
};

export function PortalHero({ items }: { items: PortalHeroItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    }
  };

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  const year = (current.release_date || current.first_air_date || "").split("-")[0];
  const rating = current.vote_average ? current.vote_average.toFixed(1) : "N/A";
  const backdropUrl = current.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${current.backdrop_path}`
    : "/placeholder.jpg";

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-slate-900 group shadow-2xl touch-pan-y select-none"
    >
      {/* 16:9 Backdrop Image */}
      <div className="relative aspect-[4/3] sm:aspect-[21/9] lg:aspect-[16/8] w-full min-h-[320px] md:min-h-[420px]">
        {current.backdrop_path ? (
          <Image
            src={backdropUrl}
            alt={current.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 75vw, 1100px"
            className="object-cover object-center transition-all duration-700 brightness-95"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <span className="text-neutral-500 font-bold">Görsel Yok</span>
          </div>
        )}

        {/* Dramatic Vignette / Dark Gradient Overlay (Merlin'in Kazanı style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20"
              aria-label="Önceki manşet"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20"
              aria-label="Sonraki manşet"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Content Details (Hero Copy) */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 lg:p-10 z-10 flex flex-col justify-end max-w-3xl">
          {/* Badge & Tags Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30">
              Öne Çıkan
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
              {current.media_type === "movie" ? "Film" : "Dizi"}
            </span>
            {current.genre_names?.slice(0, 2).map((g) => (
              <span
                key={g}
                className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider bg-white/5 text-neutral-400 border border-white/5 hidden sm:inline-block"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Heading */}
          <Link
            href={`/${current.media_type}/${current.id}`}
            className="group/link focus:outline-none"
          >
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight group-hover/link:text-amber-400 transition-colors line-clamp-2">
              {current.title}
            </h1>
          </Link>

          {/* Overview Excerpt */}
          <p className="mt-2 text-sm sm:text-base text-neutral-300 line-clamp-2 font-normal max-w-2xl leading-relaxed">
            {current.overview || "Bu yapım hakkında henüz bir Türkçe özet girilmedi."}
          </p>

          {/* Meta Row (Year, Rating, Reviews, CTA) */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-neutral-400">
            {year && (
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                {year}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {rating} / 10
            </span>
            {current.vote_count ? (
              <span className="flex items-center gap-1.5 text-neutral-400 hidden sm:flex">
                <MessageSquare className="w-4 h-4" />
                {current.vote_count} Oy
              </span>
            ) : null}

            <Link
              href={`/${current.media_type}/${current.id}`}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm transition-transform active:scale-95 shadow-md shadow-amber-400/20"
            >
              <Play className="w-4 h-4 fill-current" />
              İncele
            </Link>
          </div>
        </div>

        {/* Carousel Indicators / Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-3 right-4 sm:right-5 z-20 flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-5 sm:w-6 bg-amber-400" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Slayt ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
