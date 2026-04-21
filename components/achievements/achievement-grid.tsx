"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Achievement {
  type: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  unlocked: boolean;
  unlockedAt: Date | null;
}

interface AchievementGridProps {
  achievements: Achievement[];
}

export function AchievementGrid({ achievements }: AchievementGridProps) {
  const [selectedAchievement, setSelected] = useState<Achievement | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {achievements.map((achievement) => (
          <button
            key={achievement.type}
            onClick={() => setSelected(achievement)}
            className={`relative group rounded-2xl p-4 text-center transition-all ${
              achievement.unlocked
                ? `bg-gradient-to-br ${achievement.color} bg-opacity-20 border border-white/20 shadow-lg hover:scale-105`
                : "bg-white/5 border border-white/5 opacity-50 hover:opacity-70"
            }`}
          >
            {/* Icon */}
            <div className="text-3xl mb-2">
              {achievement.unlocked ? achievement.icon : "🔒"}
            </div>

            {/* Label */}
            <h3 className="text-xs font-bold text-white truncate">
              {achievement.label}
            </h3>

            {/* Unlocked indicator */}
            {achievement.unlocked && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-neutral-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4 ${
                selectedAchievement.unlocked
                  ? `bg-gradient-to-br ${selectedAchievement.color}`
                  : "bg-white/5"
              }`}
            >
              {selectedAchievement.unlocked ? selectedAchievement.icon : "🔒"}
            </div>

            <h2 className="text-xl font-black text-white mb-1">
              {selectedAchievement.label}
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              {selectedAchievement.description}
            </p>

            {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
              <div className="bg-green-400/10 text-green-400 text-xs font-bold px-3 py-2 rounded-xl inline-block">
                ✅{" "}
                {formatDistanceToNow(new Date(selectedAchievement.unlockedAt), {
                  addSuffix: true,
                  locale: tr,
                })}{" "}
                kazanıldı
              </div>
            )}

            {!selectedAchievement.unlocked && (
              <div className="bg-white/5 text-neutral-500 text-xs font-bold px-3 py-2 rounded-xl inline-block">
                Henüz kazanılmadı
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-6 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
