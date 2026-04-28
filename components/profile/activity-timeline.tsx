"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Star, Eye, MessageCircle, Plus } from "lucide-react";
import { useState } from "react";

interface Activity {
  id: string;
  type: string;
  createdAt: Date;
  rating?: number | null;
  media: {
    id: string;
    title: string;
    posterPath: string | null;
    releaseDate?: string | Date | null;
  };
}

interface ActivityTimelineProps {
  activities: Activity[];
  showActivities: boolean;
}

export function ActivityTimeline({ activities, showActivities }: ActivityTimelineProps) {
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

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = format(new Date(activity.createdAt), "dd MMMM yyyy", { locale: tr });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="space-y-8">
      {sortedDates.map((date, dateIndex) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-4 sticky top-20 bg-background/80 backdrop-blur-md py-2 z-10">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <h3 className="text-sm font-bold text-white tracking-tight uppercase">
              {date}
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></div>
          </div>

          {/* Activities for this date */}
          <div className="space-y-3 pl-4 border-l border-white/10">
            {groupedActivities[date].map((activity) => {
              const activityIcon = activity.type === "watched" ? Eye : activity.type === "rated" ? Star : Plus;
              const Icon = activityIcon;
              const timeText = formatDistanceToNow(new Date(activity.createdAt), { 
                locale: tr, 
                addSuffix: true 
              });

              return (
                <Link
                  key={activity.id}
                  href={`/media/${activity.media.id}`}
                  className="group flex gap-4 p-4 rounded-xl border border-white/5 backdrop-blur-sm transition-all hover:bg-white/5 hover:border-primary/20 active:scale-95"
                >
                  {/* Poster Image */}
                  <div className="relative shrink-0 w-16 h-24 overflow-hidden rounded-lg shadow-lg bg-neutral-800">
                    {activity.media.posterPath && !imageErrors.has(activity.media.id) ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                        alt={activity.media.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="64px"
                        loading="lazy"
                        onError={() => handleImageError(activity.media.id)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-2xl">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-white group-hover:text-primary transition-colors truncate flex-1">
                        {activity.media.title}
                      </h4>
                      <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Activity Type & Time */}
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                      <span className="font-medium">
                        {activity.type === "watched" && "İzlendi"}
                        {activity.type === "rated" && "Puanlandı"}
                        {activity.type === "commented" && "Yorum yapıldı"}
                        {activity.type === "added" && "Listeye eklendi"}
                      </span>
                      <span>•</span>
                      <span>{timeText}</span>
                    </div>

                    {/* Rating if exists */}
                    {activity.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(activity.rating!)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-neutral-600"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-neutral-400 ml-1">
                          {activity.rating.toFixed(1)}/5
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
