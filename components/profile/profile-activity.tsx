"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Star, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Activity {
  id: string;
  type: string;
  createdAt: Date;
  rating?: number | null;
  media: {
    id: string;
    tmdbId?: number;
    type?: string;
    title: string;
    posterPath: string | null;
    releaseDate?: string | Date | null;
  };
}

interface ProfileActivityProps {
  activities: Activity[];
  showActivities: boolean;
  variant?: "list" | "grid" | "carousel";
  userId?: string;
}

export function ProfileActivity({
  activities,
  showActivities,
  variant = "list",
  userId,
}: ProfileActivityProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (mediaId: string) => {
    setImageErrors(prev => new Set([...prev, mediaId]));
  };
  if (!showActivities) {
    return (
      <div className="w-full bg-white/5 border border-white/5 border-dashed rounded-2xl p-8 text-center flex flex-col items-center gap-3 backdrop-blur-sm">
        <Eye className="w-8 h-8 text-neutral-600" />
        <p className="text-neutral-500 font-bold">Aktiviteler gizlendi.</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="w-full bg-white/5 border border-white/5 border-dashed rounded-2xl p-8 text-center flex flex-col items-center gap-3 backdrop-blur-sm">
        <Eye className="w-8 h-8 text-neutral-600" />
        <p className="text-neutral-500 font-bold">Henüz bir aktivite yok.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      variant === "carousel" 
        ? "flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        : variant === "list" 
          ? "space-y-3" 
          : "grid grid-cols-1 md:grid-cols-2 gap-4"
    )}>
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "group",
            variant === "carousel" && "flex-shrink-0"
          )}
        >
          <Link
            href={`/${activity.media.type?.toLowerCase() === "tv" ? "tv" : "movie"}/${(activity.media as any).tmdbId || activity.media.id}`}
            className={cn(
              "flex gap-3 p-3 rounded-xl border border-white/5 backdrop-blur-sm transition-all hover:bg-white/5 hover:border-primary/20 active:scale-95",
              variant === "list" ? "bg-white/2" : variant === "carousel" ? "flex-col bg-white/2 w-32" : "flex-col bg-white/2"
            )}
          >
            {/* Poster Image */}
            <div className={cn(
              "relative shrink-0 overflow-hidden rounded-lg shadow-lg bg-neutral-800",
              variant === "list" ? "w-12 h-16" : variant === "carousel" ? "w-full h-32" : "w-full h-32"
            )}>
              {activity.media.posterPath && !imageErrors.has(activity.media.id) ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                  alt={activity.media.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes={variant === "list" ? "48px" : "100%"}
                  loading="lazy"
                  onError={() => handleImageError(activity.media.id)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-2xl">
                  🎬
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold mb-1">
                  {formatDistanceToNow(activity.createdAt, { addSuffix: true, locale: tr })}
                </p>
                <p className="font-bold text-white group-hover:text-primary transition-colors truncate text-sm">
                  {activity.media.title}
                </p>
              </div>

              {/* Activity Badge */}
              <div className="flex items-center gap-2 mt-2">
                {activity.type === "WATCHED" ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                    İzledi
                  </span>
                ) : activity.type === "RATED" || activity.rating ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold">
                    <Star className="w-3 h-3" />
                    {activity.rating?.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    {activity.type}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
