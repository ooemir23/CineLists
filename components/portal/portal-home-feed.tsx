"use client";

import Link from "next/link";
import {
  Flame,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ActivityPost } from "@/components/feed/activity-post";
import type { FeedActivity } from "@/lib/feed-actions";

type PortalHomeFeedProps = {
  activities: FeedActivity[];
  user?: {
    name?: string | null;
    image?: string | null;
    id?: string | null;
  } | null;
  layout?: "vertical" | "grid";
  maxItems?: number;
};

export function PortalHomeFeed({
  activities = [],
  user: _user,
  layout: _layout = "vertical",
  maxItems = 5,
}: PortalHomeFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
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
          <span>Tüm Akışı İncele</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Activities List (Instagram Style Cards) */}
      {displayActivities.length > 0 ? (
        <>
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <ActivityPost key={activity.id} activity={activity as any} />
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              Son aktiviteler
            </span>
            <Link
              href="/feed"
              className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors group"
            >
              <span>Tüm Akışı İncele</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </>
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
