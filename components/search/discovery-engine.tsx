"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Star, Play, Tv } from "lucide-react";

interface DiscoveryEngineProps {
    dayMovie: React.ReactNode;
    dayTV: React.ReactNode;
    weekMovie: React.ReactNode;
    weekTV: React.ReactNode;
    monthMovie: React.ReactNode;
    monthTV: React.ReactNode;
}

type Period = "day" | "week" | "month";
type MediaType = "movie" | "tv";

export function DiscoveryEngine({
    dayMovie,
    dayTV,
    weekMovie,
    weekTV,
    monthMovie,
    monthTV,
}: DiscoveryEngineProps) {
    const [period, setPeriod] = useState<Period>("day");
    const [type, setType] = useState<MediaType>("movie");

    const periods = [
        { id: "day", label: "Günün", icon: Clock, color: "from-amber-400 to-orange-500" },
        { id: "week", label: "Haftanın", icon: Calendar, color: "from-primary to-indigo-600" },
        { id: "month", label: "Ayın", icon: Star, color: "from-blue-400 to-blue-600" },
    ];

    const types = [
        { id: "movie", label: "Filmler", icon: Play },
        { id: "tv", label: "Diziler", icon: Tv },
    ];

    const activeContent = {
        day: { movie: dayMovie, tv: dayTV },
        week: { movie: weekMovie, tv: weekTV },
        month: { movie: monthMovie, tv: monthTV },
    }[period][type];

    return (
        <div className="flex flex-col gap-3">
            {/* Dynamic Header & Switchers */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* Period Pills */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 shrink-0">
                    {periods.map((p) => {
                        const Icon = p.icon;
                        const isActive = period === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id as Period)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden group",
                                    isActive ? "text-white" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <div
                                        className={cn("absolute inset-0 bg-gradient-to-r shadow-lg rounded-lg", p.color)}
                                    />
                                )}
                                <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-white")} />
                                <span className="relative z-10">{p.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Type Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 shrink-0">
                    {types.map((t) => {
                        const Icon = t.icon;
                        const isActive = type === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id as MediaType)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden group",
                                    isActive ? "text-white" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <div
                                        className="absolute inset-0 bg-white/15 border border-white/10 shadow-lg rounded-lg"
                                    />
                                )}
                                <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-colors", isActive ? "text-amber-400" : "text-neutral-500 group-hover:text-neutral-300")} />
                                <span className="relative z-10">{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area with Animation */}
            <div className="relative min-h-[300px]">
                <div
                    key={period + type}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-400"
                >
                    {activeContent}
                </div>
            </div>
        </div>
    );
}
