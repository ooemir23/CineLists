"use client";

import { Flame, Clock, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightsCardProps {
  totalHours?: number;
  streakDays?: number;
  averageRating?: number;
  thisMonthCount?: number;
}

export function InsightsCard({
  totalHours = 0,
  streakDays = 0,
  averageRating = 0,
  thisMonthCount = 0,
}: InsightsCardProps) {
  const insights = [
    {
      icon: Clock,
      label: "Toplam Süre",
      value: totalHours > 0 ? `${totalHours}s` : "—",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      show: totalHours > 0,
    },
    {
      icon: Flame,
      label: "Seri",
      value: streakDays > 0 ? `${streakDays} gün` : "—",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      show: streakDays > 0,
    },
    {
      icon: TrendingUp,
      label: "Ort. Puan",
      value: averageRating > 0 ? averageRating.toFixed(1) : "—",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      show: averageRating > 0,
    },
    {
      icon: Calendar,
      label: "Bu Ay",
      value: thisMonthCount > 0 ? `${thisMonthCount}` : "—",
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      show: thisMonthCount > 0,
    },
  ];

  const visible = insights.filter((i) => i.show);

  if (visible.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-white tracking-tight uppercase">
        Öne Çıkanlar
      </h2>
      <div className={cn("grid gap-2", visible.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
        {visible.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.label}
              className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-2.5"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", insight.bgColor)}>
                <Icon className={cn("w-4 h-4", insight.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white leading-none mb-1">
                  {insight.value}
                </div>
                <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                  {insight.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
