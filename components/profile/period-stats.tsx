"use client";

import { useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface PeriodStatsProps {
  activities?: any[];
  watchedItems?: any[];
  userId?: string;
}

export function PeriodStats({ activities = [], watchedItems = [], userId }: PeriodStatsProps) {
  const [period, setPeriod] = useState<Period>("month");

  const getPeriodData = (p: Period) => {
    const now = new Date();
    const startDate = new Date();

    if (p === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (p === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const watched = watchedItems.filter((item: any) => {
      const itemDate = new Date(item.watchedAt);
      return itemDate >= startDate && itemDate <= now;
    });

    const activities_count = activities.filter((activity: any) => {
      const actDate = new Date(activity.createdAt);
      return actDate >= startDate && actDate <= now;
    }).length;

    const movies = watched.filter((w: any) => w.media?.type === "MOVIE").length;
    const shows = watched.filter((w: any) => w.media?.type === "TV").length;
    const ratings = watched.filter((w: any) => w.rating != null && w.rating > 0).length;

    const avgRatingValue =
      ratings > 0
        ? parseFloat((watched.filter((w: any) => w.rating).reduce((sum: number, w: any) => sum + (w.rating || 0), 0) / ratings).toFixed(1))
        : 0;

    return {
      totalWatched: watched.length,
      movies,
      shows,
      ratings,
      activities: activities_count,
      avgRating: avgRatingValue,
    };
  };

  const data = getPeriodData(period);

  const periods: { value: Period; label: string }[] = [
    { value: "week", label: "Hafta" },
    { value: "month", label: "Ay" },
    { value: "year", label: "Yıl" },
  ];

  const periodLabel =
    period === "week" ? "Bu Hafta" : period === "month" ? "Bu Ay" : "Bu Yıl";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={userId ? `/profile/${userId}/stats` : "/profile/stats"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            {periodLabel} Özeti
          </h2>
        </Link>

        {/* Period Tabs */}
        <div className="flex gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/5">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded transition-all",
                period === p.value
                  ? "bg-primary/20 text-primary"
                  : "text-neutral-400 hover:text-neutral-300"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            label: "İzlenen",
            value: data.totalWatched,
            icon: "📺",
            color: "from-blue-500/20 to-blue-600/20",
          },
          {
            label: "Film",
            value: data.movies,
            icon: "🎬",
            color: "from-purple-500/20 to-purple-600/20",
          },
          {
            label: "Dizi",
            value: data.shows,
            icon: "📺",
            color: "from-pink-500/20 to-pink-600/20",
          },
          {
            label: "Puanlanan",
            value: data.ratings,
            icon: "⭐",
            color: "from-amber-500/20 to-amber-600/20",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "bg-gradient-to-br border border-white/5 rounded-lg p-3 text-center",
              stat.color
            )}
          >
            <div className="text-lg mb-1">{stat.icon}</div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-neutral-400 font-medium uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Average Rating */}
      {data.avgRating > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-neutral-400 font-medium mb-1">Ortalama Puan</p>
          <p className="text-2xl font-bold text-amber-400">{data.avgRating}</p>
        </div>
      )}
    </section>
  );
}
