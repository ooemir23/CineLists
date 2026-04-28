"use client";

import { Film, Tv, Bookmark, Eye, Activity, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileStatsProps {
  movieCount: number;
  showCount: number;
  watchlistCount: number;
  watchedCount: number;
  showStats: boolean;
}

export function ProfileStats({
  movieCount,
  showCount,
  watchlistCount,
  watchedCount,
  showStats,
}: ProfileStatsProps) {
  if (!showStats) {
    return (
      <div className="w-full bg-white/[0.02] border border-white/5 border-dashed rounded-xl p-4 text-center flex items-center justify-center gap-2">
        <Lock className="w-4 h-4 text-neutral-600" />
        <p className="text-xs text-neutral-500 font-medium">İstatistikler gizlendi</p>
      </div>
    );
  }

  const stats = [
    {
      value: movieCount,
      label: "Film",
      icon: Film,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      href: "/watched?type=movie",
    },
    {
      value: showCount,
      label: "Dizi",
      icon: Tv,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      href: "/watched?type=tv",
    },
    {
      value: watchlistCount,
      label: "Listem",
      icon: Bookmark,
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      href: "/watchlist",
    },
    {
      value: watchedCount,
      label: "İzlenen",
      icon: Eye,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      href: "/watched",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                <Icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-white leading-none">
                  {stat.value}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                  {stat.label}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
