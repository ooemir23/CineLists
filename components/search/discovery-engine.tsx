"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <div className="space-y-8">
            {/* Dynamic Header & Switchers */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-2 h-10 rounded-full bg-gradient-to-b transition-all duration-500",
                            periods.find(p => p.id === period)?.color
                        )} />
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                                Popüler Keşfet <span className="text-primary italic">.</span>
                            </h2>
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest px-1">
                                İlgi çekenleri yakala
                            </p>
                        </div>
                    </div>

                    {/* Period Pillas */}
                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[1.25rem] border border-white/5 w-fit">
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
                                        <motion.div
                                            layoutId="period-pill"
                                            className={cn("absolute inset-0 bg-gradient-to-r shadow-lg", p.color)}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-white")} />
                                    <span className="relative z-10">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Type Switcher */}
                <div className="flex bg-neutral-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit self-start md:self-end">
                    {types.map((t) => {
                        const Icon = t.icon;
                        const isActive = type === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id as MediaType)}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all relative group",
                                    isActive ? "text-white" : "text-neutral-500 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="type-pill"
                                        className="absolute inset-0 bg-white/10 border border-white/10 shadow-xl"
                                        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                                    />
                                )}
                                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-neutral-600 group-hover:text-neutral-400")} />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area with Animation */}
            <div className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={period + type}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {activeContent}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
