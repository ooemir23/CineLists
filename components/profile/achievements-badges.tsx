"use client";

import { Trophy, Award, Star, Flame, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
  unlockedAt?: Date | null;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface AchievementsBadgesProps {
  achievements?: any[];
  movieCount: number;
  showCount: number;
  watchedCount: number;
  averageRating: number;
  hasVerifiedEmail?: boolean;
}

export function AchievementsBadges({
  achievements: _achievements = [],
  movieCount,
  showCount,
  watchedCount,
  averageRating,
  hasVerifiedEmail: _hasVerifiedEmail = false,
}: AchievementsBadgesProps) {
  // Auto-generate achievements based on stats
  const generatedAchievements: Achievement[] = [];

  // 🎬 Film Milestones
  if (movieCount >= 10) {
    generatedAchievements.push({
      id: "film-10",
      name: "Film Buffu",
      description: "10+ film izle",
      icon: Eye,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-blue-600/20",
      rarity: "common",
      unlockedAt: new Date(),
    });
  }
  if (movieCount >= 50) {
    generatedAchievements.push({
      id: "film-50",
      name: "Sinema Aşkı",
      description: "50+ film izle",
      icon: Eye,
      color: "text-blue-500",
      bgColor: "from-blue-600/20 to-blue-700/20",
      rarity: "rare",
      unlockedAt: new Date(),
    });
  }
  if (movieCount >= 100) {
    generatedAchievements.push({
      id: "film-100",
      name: "Film Legendi",
      description: "100+ film izle",
      icon: Trophy,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-amber-600/20",
      rarity: "epic",
      unlockedAt: new Date(),
    });
  }

  // 📺 Dizi Milestones
  if (showCount >= 10) {
    generatedAchievements.push({
      id: "tv-10",
      name: "Dizi Takipçi",
      description: "10+ dizi izle",
      icon: Star,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-purple-600/20",
      rarity: "common",
      unlockedAt: new Date(),
    });
  }
  if (showCount >= 50) {
    generatedAchievements.push({
      id: "tv-50",
      name: "Binge Watcher",
      description: "50+ dizi izle",
      icon: Star,
      color: "text-purple-500",
      bgColor: "from-purple-600/20 to-purple-700/20",
      rarity: "rare",
      unlockedAt: new Date(),
    });
  }

  // ⭐ Rating Milestones
  if (averageRating >= 7) {
    generatedAchievements.push({
      id: "rating-7",
      name: "Seçici Zevk",
      description: "Ort. 7+ puan veren",
      icon: Award,
      color: "text-yellow-400",
      bgColor: "from-yellow-500/20 to-yellow-600/20",
      rarity: "rare",
      unlockedAt: new Date(),
    });
  }
  if (averageRating >= 8) {
    generatedAchievements.push({
      id: "rating-8",
      name: "Müzik Zevki",
      description: "Ort. 8+ puan veren",
      icon: Award,
      color: "text-orange-400",
      bgColor: "from-orange-500/20 to-orange-600/20",
      rarity: "epic",
      unlockedAt: new Date(),
    });
  }

  // 🔥 Combined Milestones
  if (watchedCount >= 100) {
    generatedAchievements.push({
      id: "watched-100",
      name: "Centenarian",
      description: "100+ içerik izle",
      icon: Flame,
      color: "text-red-400",
      bgColor: "from-red-500/20 to-red-600/20",
      rarity: "epic",
      unlockedAt: new Date(),
    });
  }

  // 🏆 Ultimate Achievement
  if (
    movieCount >= 50 &&
    showCount >= 20 &&
    averageRating >= 7.5 &&
    watchedCount >= 100
  ) {
    generatedAchievements.push({
      id: "master",
      name: "Sinema Ustası",
      description: "Tüm kriterleri karşıla",
      icon: Trophy,
      color: "text-amber-300",
      bgColor: "from-amber-400/20 to-amber-500/20",
      rarity: "legendary",
      unlockedAt: new Date(),
    });
  }

  if (generatedAchievements.length === 0) return null;

  const rarityOrder = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
  };

  const sorted = [...generatedAchievements].sort(
    (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-tight uppercase">
          🏆 Rozetler ({sorted.length})
        </h2>
        <Link
          href="/achievements"
          className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Tümü
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {sorted.map((achievement) => {
          const Icon = achievement.icon;
          const isLegendary = achievement.rarity === "legendary";

          return (
            <div
              key={achievement.id}
              className={cn(
                "group relative bg-gradient-to-br border rounded-lg p-3 overflow-hidden transition-all hover:scale-105 active:scale-95",
                isLegendary
                  ? "border-amber-400/50 from-amber-500/20 to-amber-600/20 shadow-lg shadow-amber-500/20"
                  : achievement.rarity === "epic"
                    ? "border-orange-400/30 from-orange-500/20 to-orange-600/20"
                    : achievement.rarity === "rare"
                      ? "border-purple-400/30 from-purple-500/20 to-purple-600/20"
                      : "border-blue-400/20 from-blue-500/20 to-blue-600/20"
              )}
              title={achievement.description}
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex flex-col items-center justify-center text-center gap-2">
                <div className={cn("p-2 rounded-lg", achievement.bgColor)}>
                  <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", achievement.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {achievement.name}
                  </p>
                  <p className="text-[9px] text-neutral-400 mt-0.5">
                    {achievement.rarity === "legendary"
                      ? "⭐ Efsanevi"
                      : achievement.rarity === "epic"
                        ? "♦️ Epik"
                        : achievement.rarity === "rare"
                          ? "◆ Nadir"
                          : "○ Adi"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
