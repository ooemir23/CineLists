"use client";

import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileCompletionProps {
  hasAvatar: boolean;
  hasBio: boolean;
  hasFavoriteGenres: boolean;
  hasFavoritePersons: boolean;
  hasWatchedItems: boolean;
  onEditProfile?: () => void;
}

export function ProfileCompletion({
  hasAvatar,
  hasBio,
  hasFavoriteGenres,
  hasFavoritePersons,
  hasWatchedItems,
  onEditProfile,
}: ProfileCompletionProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const tasks = [
    { label: "Profil resmi ekle", done: hasAvatar, action: onEditProfile },
    { label: "Biyografi yaz", done: hasBio, action: onEditProfile },
    { label: "Favori türleri seç", done: hasFavoriteGenres, action: onEditProfile },
    { label: "Favori oyuncu ekle", done: hasFavoritePersons, href: "/search" },
    { label: "İlk filmi izledim işaretle", done: hasWatchedItems, href: "/explore/movie/popular" },
  ];

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const percentage = Math.round((completed / total) * 100);

  // Don't show if 100% complete or dismissed
  if (percentage === 100 || isDismissed) return null;

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20 rounded-xl p-4 overflow-hidden">
      {/* Background sparkle effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profilini Tamamla</h3>
              <p className="text-xs text-neutral-400">
                {completed}/{total} adım tamamlandı
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Kapat"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-neutral-500 font-medium">
              %{percentage} tamamlandı
            </span>
            <span className="text-[10px] text-primary font-bold">
              {total - completed} kaldı
            </span>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-1.5">
          {tasks
            .filter((t) => !t.done)
            .slice(0, 3)
            .map((task, idx) => {
              const content = (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors group cursor-pointer">
                  <Circle className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                  <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                    {task.label}
                  </span>
                </div>
              );

              if (task.href) {
                return (
                  <Link key={idx} href={task.href}>
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={task.action}
                  className="w-full text-left"
                >
                  {content}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
