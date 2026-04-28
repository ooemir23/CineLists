"use client";

import { Film, Tv, Heart, Activity, Star, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileStatsProps {
  movieCount: number;
  showCount: number;
  watchlistCount: number;
  watchedCount: number;
  averageRating?: number;
  totalHours?: number;
  showStats: boolean;
  isCompact?: boolean;
}

const statItems = [
  {
    icon: Film,
    label: "Film",
    colorClass: "from-blue-600/20 to-blue-600/0 text-blue-400",
    iconColor: "text-blue-400",
  },
  {
    icon: Tv,
    label: "Dizi",
    colorClass: "from-purple-600/20 to-purple-600/0 text-purple-400",
    iconColor: "text-purple-400",
  },
  {
    icon: Heart,
    label: "İzlenecek",
    colorClass: "from-pink-600/20 to-pink-600/0 text-pink-400",
    iconColor: "text-pink-400",
  },
  {
    icon: Eye,
    label: "İzlenen",
    colorClass: "from-yellow-600/20 to-yellow-600/0 text-yellow-400",
    iconColor: "text-yellow-400",
  },
];

export function ProfileStats({
  movieCount,
  showCount,
  watchlistCount,
  watchedCount,
  averageRating = 0,
  totalHours = 0,
  showStats,
  isCompact = false,
}: ProfileStatsProps) {
  if (!showStats) {
    return (
      <div className="w-full bg-white/5 border border-white/5 border-dashed rounded-2xl p-8 text-center flex flex-col items-center gap-3 backdrop-blur-sm">
        <Activity className="w-8 h-8 text-neutral-600" />
        <p className="text-neutral-500 font-bold">İstatistikler gizlendi.</p>
      </div>
    );
  }

  const stats = [
    { value: movieCount, label: "Film", icon: Film, color: "blue" },
    { value: showCount, label: "Dizi", icon: Tv, color: "purple" },
    { value: watchlistCount, label: "İzlenecek", icon: Heart, color: "pink" },
    { value: watchedCount, label: "İzlenen", icon: Eye, color: "yellow" },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Main Stats Grid */}
      <div className={cn(
        "grid gap-2 sm:gap-3 md:gap-4",
        isCompact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"
      )}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-white/10 backdrop-blur-sm group hover:border-white/20 transition-all",
                `bg-gradient-to-br from-${stat.color}-600/10 to-transparent`
              )}
            >
              {/* Background Glow */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                `bg-gradient-to-br from-${stat.color}-600/5 to-transparent`
              )} />

              <div className="relative z-10 space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <Icon className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6",
                    `text-${stat.color}-400`
                  )} />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest line-clamp-1">
                  {stat.label}
                </div>
              </div>

              {/* Hover Line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-300" />
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Stats (Compact View) */}
      {!isCompact && (averageRating > 0 || totalHours > 0) && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {averageRating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-600/10 to-transparent rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 fill-current" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest">
                Ort. Puan
              </div>
            </motion.div>
          )}

          {totalHours > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-cyan-600/10 to-transparent rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {totalHours}h
              </div>
              <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest">
                İzleme Süresi
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
