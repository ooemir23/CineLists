"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  ArrowRight,
  Star,
  MessageSquare,
  Heart,
  Film,
  Tv,
  Sparkles,
  Quote,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FeedActivity } from "@/lib/feed-actions";

type PortalHomeFeedProps = {
  activities: FeedActivity[];
  user?: {
    name?: string | null;
    image?: string | null;
    id?: string | null;
  } | null;
};

export function PortalHomeFeed({ activities = [], user }: PortalHomeFeedProps) {
  const getActionBadge = (type: FeedActivity["type"], hasReview: boolean) => {
    if (hasReview || type === "REVIEWED") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-400/15 text-emerald-400 border border-emerald-400/25">
          İnceleme
        </span>
      );
    }
    if (type === "RATED") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400/15 text-amber-400 border border-amber-400/25">
          Puanladı
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-400/15 text-sky-400 border border-sky-400/25">
        İzledi
      </span>
    );
  };

  const formatTimeAgo = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
    } catch {
      return "Az önce";
    }
  };

  return (
    <section className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Canlı Sosyal Akış
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Canlı
          </span>
        </div>

        <Link
          href="/feed"
          className="text-xs font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors group"
        >
          <span>Tüm Akışı Gör</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Activities: Mobile Swipeable Carousel / Desktop Grid */}
      {activities.length > 0 ? (
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-3.5 pb-2 sm:pb-0 scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid-cols-2 lg:grid-cols-3">
          {activities.slice(0, 6).map((activity) => {
            const mediaType = activity.media.type?.toLowerCase() || "movie";
            const mediaUrl = `/${mediaType}/${activity.media.tmdbId}`;
            const posterUrl = activity.media.posterPath
              ? `https://image.tmdb.org/t/p/w200${activity.media.posterPath}`
              : null;
            const hasReview = Boolean(activity.review && activity.review.trim().length > 0);

            return (
              <article
                key={activity.id}
                className="w-[82vw] max-w-[330px] sm:w-auto shrink-0 snap-start flex flex-col justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-amber-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 group"
              >
                <div>
                  {/* User info row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Link
                      href={`/profile/${activity.user.id}`}
                      className="flex items-center gap-2 min-w-0 group/user"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden relative bg-amber-400/20 border border-amber-400/30 shrink-0">
                        {activity.user.image ? (
                          <Image
                            src={activity.user.image}
                            alt={activity.user.name || "Kullanıcı"}
                            fill
                            sizes="28px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-amber-400 font-bold text-xs">
                            {activity.user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white group-hover/user:text-amber-400 transition-colors truncate">
                        {activity.user.name || "Sinefil"}
                      </span>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getActionBadge(activity.type, hasReview)}
                    </div>
                  </div>

                  {/* Media card content */}
                  <Link href={mediaUrl} className="flex gap-3.5 group/media">
                    <div className="relative w-14 sm:w-16 h-20 sm:h-22 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-md">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={activity.media.title}
                          fill
                          sizes="64px"
                          className="object-cover group-hover/media:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500 bg-white/5">
                          {mediaType === "tv" ? (
                            <Tv className="w-5 h-5" />
                          ) : (
                            <Film className="w-5 h-5" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h4 className="text-sm sm:text-base font-extrabold text-white group-hover/media:text-amber-400 transition-colors line-clamp-1 leading-snug">
                        {activity.media.title}
                      </h4>

                      {activity.episode && (
                        <span className="text-xs text-sky-400 font-semibold mt-1 truncate">
                          S{activity.episode.seasonNumber} B{activity.episode.episodeNumber}:{" "}
                          {activity.episode.title}
                        </span>
                      )}

                      {activity.rating && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {activity.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Review excerpt if available */}
                  {hasReview && (
                    <div className="mt-3 p-2.5 rounded-lg bg-white/[0.04] border-l-2 border-amber-400 text-xs sm:text-[13px] text-neutral-300 italic line-clamp-2 leading-relaxed">
                      &ldquo;{activity.review}&rdquo;
                    </div>
                  )}
                </div>

                {/* Card Footer: Time ago & Interactivity */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500">
                  <span>{formatTimeAgo(activity.createdAt)}</span>
                  <div className="flex items-center gap-3">
                    {activity.votes > 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        {activity.votes}
                      </span>
                    )}
                    {(activity._count?.comments ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-semibold">
                        <MessageSquare className="w-3 h-3 text-sky-400" />
                        {activity._count.comments}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-amber-400 mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-neutral-200">
            Topluluk akışı yükleniyor...
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Arkadaşlarını takip ederek ve filmleri puanlayarak canlı akışı zenginleştirebilirsin.
          </p>
          <Link
            href="/feed"
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition-colors"
          >
            Akışa Git
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
