"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  activities?: any[];
  title?: string;
  userId?: string;
}

export function ActivityHeatmap({ activities = [], title = "Son 30 Gün", userId }: ActivityHeatmapProps) {
  // Generate last 30 days grid
  const today = new Date();
  const days: { date: Date; count: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({ date, count: 0 });
  }

  // Count activities per day
  if (activities && Array.isArray(activities)) {
    activities.forEach((activity: any) => {
      const actDate = new Date(activity.createdAt);
      const dayIndex = days.findIndex(
        (d) =>
          d.date.toDateString() === actDate.toDateString()
      );
      if (dayIndex !== -1) {
        days[dayIndex].count++;
      }
    });
  }

  // Determine max for coloring
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-white/5 hover:bg-white/10";
    const intensity = Math.min(Math.ceil((count / maxCount) * 4), 4);
    const colors = [
      "bg-primary/20 hover:bg-primary/30",
      "bg-primary/40 hover:bg-primary/50",
      "bg-primary/60 hover:bg-primary/70",
      "bg-primary/80 hover:bg-primary/90",
    ];
    return colors[intensity - 1];
  };

  // Group into weeks for display
  const weeks: { date: Date; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const totalActivities = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={userId ? `/profile/${userId}/activities` : "/profile/activities"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            {title}
          </h2>
        </Link>
        <div className="text-xs text-neutral-400 font-medium">
          {totalActivities} aktivite
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 overflow-x-auto">
        <div className="flex gap-1.5">
          {weeks.map((week, weekIdx) => (
            <div
              key={weekIdx}
              className="flex flex-col gap-1.5"
              style={{ minWidth: "max-content" }}
            >
              {week.map((day, dayIdx) => (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={cn(
                    "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded transition-all cursor-default border border-white/5",
                    getColor(day.count)
                  )}
                  title={`${day.date.toLocaleDateString("tr-TR")}: ${day.count} aktivite`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
        <span>Daha az</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-sm border border-white/10",
                i === 0
                  ? "bg-white/5"
                  : `bg-primary/${i * 20}`
              )}
            />
          ))}
        </div>
        <span>Daha fazla</span>
      </div>
    </section>
  );
}
