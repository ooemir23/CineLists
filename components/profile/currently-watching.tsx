"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentlyWatchingProps {
  mediaItems?: any[];
  maxDisplay?: number;
}

export function CurrentlyWatching({
  mediaItems = [],
  maxDisplay = 3,
}: CurrentlyWatchingProps) {
  if (!mediaItems || mediaItems.length === 0) return null;

  const displayed = mediaItems.slice(0, maxDisplay);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-primary fill-primary" />
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            Şu An İzleniyor
          </h2>
        </div>
      </div>

      <div className="space-y-2">
        {displayed.map((item, idx) => (
          <Link
            key={item.id || idx}
            href={`/${item.type?.toLowerCase() === "tv" ? "tv" : "movie"}/${item.tmdbId ?? item.id}`}
            className="group flex gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-primary/30 rounded-xl transition-all active:scale-95"
          >
            {/* Poster */}
            {item.posterPath && (
              <div className="relative w-10 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg bg-neutral-800">
                <Image
                  src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="40px"
                  loading="lazy"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                {item.title}
              </p>

              {item.nextEpisode && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <p className="text-xs text-neutral-400">
                    {item.nextEpisode.season}x{item.nextEpisode.episode} - {item.nextEpisode.name}
                  </p>
                </div>
              )}

              {item.progress && (
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Play Indicator */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Play className="w-4 h-4 text-primary fill-primary" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
