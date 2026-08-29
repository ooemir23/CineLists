"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Sparkles, Search, Users, Activity, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityPost } from "./activity-post";

interface FeedClientProps {
  initialActivities: any[];
  sessionUserId: string;
  followingCount: number;
}

export function FeedClient({ initialActivities, sessionUserId, followingCount }: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "yours">("friends");

  const filteredActivities = useMemo(() => {
    if (activeTab === "yours") {
      return initialActivities.filter(a => a.userId === sessionUserId);
    }
    // "friends" shows everything (which includes friends + user's own)
    return initialActivities;
  }, [activeTab, initialActivities, sessionUserId]);

  return (
    <div className="w-full min-h-screen bg-[#101624] font-hanken text-[#f1f5f9] pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 pt-2 sm:pt-6">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bricolage font-extrabold text-xl sm:text-2xl leading-tight text-white tracking-tight">Akış</h1>
                <p className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Arkadaşların ne izliyor?</p>
              </div>
            </div>
            <Link
              href="/community"
              className="h-10 px-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              aria-label="Arkadaş Bul"
            >
              <Search size={16} className="text-primary" />
              <span className="hidden xs:inline">Arkadaş Bul</span>
            </Link>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1.5 bg-[#0b1120] p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <button
              onClick={() => setActiveTab("friends")}
              className={cn(
                "flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]",
                activeTab === "friends"
                  ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Arkadaşların
            </button>
            <button
              onClick={() => setActiveTab("yours")}
              className={cn(
                "flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]",
                activeTab === "yours"
                  ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Senin
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="flex flex-col gap-3.5 pb-6">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white/[0.02] rounded-3xl border border-white/5 text-center px-6 shadow-xl mt-2">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-bricolage font-bold text-lg text-white mb-1">Akış Boş</h2>
              <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto leading-relaxed">
                Yeni içerikler görmek için topluluktan arkadaş bulup takip etmeye başla.
              </p>
              <Link
                href="/community"
                className="px-5 py-3 bg-primary text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-xs active:scale-95"
              >
                <Search size={16} />
                Arkadaş Bul
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredActivities.map((activity) => (
                <ActivityPost key={activity.id} activity={activity as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
