"use client";

import { Dice6, Star, Calendar } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RandomSuggestionProps {
  watchlistItems?: any[];
  onRefresh?: () => void;
}

export function RandomSuggestion({
  watchlistItems = [],
  onRefresh,
}: RandomSuggestionProps) {
  const [current, setCurrent] = useState(0);

  if (!watchlistItems || watchlistItems.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white tracking-tight uppercase">
          Rastgele Öner
        </h2>
        <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-xl p-6 text-center">
          <p className="text-xs text-neutral-500 font-medium">
            Önerileri görmek için listene içerik ekle
          </p>
        </div>
      </section>
    );
  }

  const suggested = watchlistItems[current];

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % watchlistItems.length);
  };

  const handleRefresh = () => {
    const random = Math.floor(Math.random() * watchlistItems.length);
    setCurrent(random);
    onRefresh?.();
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-white tracking-tight uppercase">
        🎲 Rastgele Öner
      </h2>

      <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/5 border border-primary/20 rounded-xl overflow-hidden">
        <div className="flex gap-4 p-4">
          {/* Poster */}
          {suggested.media?.posterPath && (
            <div className="relative w-20 h-32 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
              <Image
                src={`https://image.tmdb.org/t/p/w300${suggested.media.posterPath}`}
                alt={suggested.media.title}
                fill
                className="object-cover"
                sizes="80px"
                loading="lazy"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <Link
                href={`/${suggested.media?.type === "TV" ? "tv" : "movie"}/${suggested.media?.id}`}
                className="text-sm font-bold text-white hover:text-primary transition-colors line-clamp-2"
              >
                {suggested.media?.title || "Tarih Bekleniyor"}
              </Link>

              {suggested.media?.releaseDate && (
                <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(suggested.media.releaseDate).getFullYear()}
                </div>
              )}

              {suggested.media?.voteAverage && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  {(suggested.media.voteAverage / 2).toFixed(1)}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className={cn(
                  "flex-1 px-3 py-1.5 bg-primary text-black font-bold text-xs rounded-lg",
                  "hover:bg-primary/90 transition-all active:scale-95"
                )}
              >
                <Dice6 className="w-3 h-3 inline mr-1" />
                Değiştir
              </button>
              <Link
                href={`/${suggested.media?.type === "TV" ? "tv" : "movie"}/${suggested.media?.id}`}
                className="flex-1 px-3 py-1.5 bg-white/10 text-white font-bold text-xs rounded-lg hover:bg-white/15 transition-all active:scale-95 text-center"
              >
                İncele
              </Link>
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="absolute top-2 right-2 text-[10px] text-neutral-500 font-bold bg-black/50 px-2 py-0.5 rounded-full">
          {current + 1}/{watchlistItems.length}
        </div>
      </div>
    </section>
  );
}
