"use client";

import React, { useState } from "react";
// framer-motion removed — pill indicator and content transitions use CSS animations
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
        <div className="flex flex-col gap-2">
            {/* Dynamic Header & Switchers */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Pillas */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                        {periods.map((p) => {
                            const Icon = p.icon;
                            const isActive = period === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id as Period)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden group",
                                        isActive ? "text-white" : "text-neutral-500 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <div
                                            className={cn("absolute inset-0 bg-gradient-to-r shadow-lg rounded-xl", p.color)}
                                        />
                                    )}
                                    <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-white")} />
                                    <span className="relative z-10">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Type Switcher */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                        {types.map((t) => {
                            const Icon = t.icon;
                            const isActive = type === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setType(t.id as MediaType)}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden group",
                                        isActive ? "text-white" : "text-neutral-500 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 bg-white/10 border border-white/10 shadow-xl rounded-xl"
                                        />
                                    )}
                                    <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-colors", isActive ? "text-primary" : "text-neutral-600 group-hover:text-neutral-400")} />
                                    <span className="relative z-10">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
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
