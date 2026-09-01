"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  title: string;
  posterPath: string | null;
  rating?: number | null;
  type?: string;
  watchedAt?: Date | null;
}

interface RecentMediaProps {
  items: MediaItem[];
  title?: string;
  emptyMessage?: string;
  viewAllHref?: string;
  maxItems?: number;
}

export function RecentMedia({
  items,
  title = "Son İzlenenler",
  emptyMessage = "Henüz izlenen yok",
  viewAllHref = "/watched",
  maxItems = 6,
}: RecentMediaProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const displayed = items.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            {title}
          </h2>
        </div>
        <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-xl p-6 text-center">
          <p className="text-xs text-neutral-500 font-medium">{emptyMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-tight uppercase">
          {title}
        </h2>
        {viewAllHref && items.length > maxItems && (
          <Link
            href={viewAllHref}
            className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Tümünü Gör
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {displayed.map((item) => (
          <Link
            key={item.id}
            href={`/${item.type?.toLowerCase() === "tv" ? "tv" : "movie"}/${item.id}`}
            className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 active:scale-[0.97] transition-transform"
          >
            {item.posterPath && !imageErrors.has(item.id) ? (
              <Image
                src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                loading="lazy"
                onError={() =>
                  setImageErrors((prev) => new Set([...prev, item.id]))
                }
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-2xl">
                🎬
              </div>
            )}

            {/* Rating Badge */}
            {item.rating != null && item.rating > 0 && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-white">
                  {item.rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-[10px] sm:text-xs font-semibold text-white line-clamp-2 leading-tight">
                  {item.title}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
