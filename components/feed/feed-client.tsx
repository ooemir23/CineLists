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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-7 bg-radial from-[#11182b] to-[#06080e] font-hanken text-[#f1f5f9]">
      <div className="w-[393px] h-[840px] max-h-[calc(100vh-40px)] relative overflow-hidden bg-[#020617] rounded-[42px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8),_0_0_0_10px_#0a0e18] flex flex-col justify-between">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          
          {/* Header Sticky */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-[#020617] via-[#020617]/95 to-transparent px-5 pt-12 pb-3.5 flex flex-col">
            <div className="flex items-center justify-between gap-4 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-9.5 h-9.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-bricolage font-extrabold text-xl leading-tight text-white tracking-tight">Akış</h1>
                  <p className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">Arkadaşların ne izliyor?</p>
                </div>
              </div>
              <Link
                href="/community"
                className="w-9.5 h-9.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Takip Et"
              >
                <Search size={18} className="text-slate-300" />
              </Link>
            </div>

            {/* Redesigned Tab Switcher */}
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab("friends")}
                className={cn(
                  "flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]",
                  activeTab === "friends" 
                    ? "bg-primary/10 border border-primary/20 text-primary shadow-inner" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Arkadaşların
              </button>
              <button
                onClick={() => setActiveTab("yours")}
                className={cn(
                  "flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]",
                  activeTab === "yours" 
                    ? "bg-primary/10 border border-primary/20 text-primary shadow-inner" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Senin
              </button>
            </div>
          </div>

          {/* Activities List */}
          <div className="flex flex-col gap-3.5 px-5 pb-5">
            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 text-center px-6 shadow-xl mt-4">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-bricolage font-bold text-base text-white mb-1">Akış Boş</h2>
                <p className="text-xs text-slate-400 mb-5 max-w-[200px] mx-auto leading-relaxed">
                  Yeni içerikler görmek için takip etmeye başla.
                </p>
                <Link
                  href="/community"
                  className="px-4 py-2.5 bg-primary text-slate-950 font-bold rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 flex items-center gap-1.5 text-xs"
                >
                  <Search size={14} />
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
    </div>
  );
}
