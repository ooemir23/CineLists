"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Calendar, TrendingUp, Trophy } from "lucide-react";
import { HeroActions } from "./hero-actions";
import { cn } from "@/lib/utils";

type CategoryType = "trending" | "upcoming" | "tv" | "popular";

interface HeroItem {
    id: number;
    title: string;
    overview: string;
    backdrop_path: string | null;
    vote_average: number;
    media_type: "movie" | "tv";
    category: CategoryType;
}

interface HeroSliderProps {
    items: HeroItem[];
}

const CATEGORY_CONFIG = {
    trending: { label: "Günün En Gözdesi", icon: Star, color: "text-amber-400", bgColor: "bg-amber-400" },
    upcoming: { label: "Yakında Vizyonda", icon: Calendar, color: "text-blue-400", bgColor: "bg-blue-400" },
    tv: { label: "Popüler Dizi", icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-400" },
    popular: { label: "Haftanın Filmi", icon: Trophy, color: "text-purple-400", bgColor: "bg-purple-400" },
};

export function HeroSlider({ items }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance slide
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 10000); // 10 seconds per slide

        return () => clearInterval(timer);
    }, [items.length]);

    // Reset timer on interaction
    const handleManualChange = (index: number) => {
        setCurrentIndex(index);
    };

    const currentItem = items[currentIndex];
    const config = CATEGORY_CONFIG[currentItem.category];
    const Icon = config.icon;

    // Fallback backdrop
    const backdropUrl = currentItem.backdrop_path
        ? `https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`
        : "/placeholder-hero.jpg";

    return (
        <div className="flex flex-col gap-6">
            {/* Top Navigation Tabs - External Header */}
            <div className="flex items-center justify-start sm:justify-center px-2">
                <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-2 md:pb-0 no-scrollbar mask-gradient-r p-1">
                    {items.map((item, index) => {
                        const itemConfig = CATEGORY_CONFIG[item.category];
                        const isActive = index === currentIndex;
                        const ItemIcon = itemConfig.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleManualChange(index)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-300 whitespace-nowrap",
                                    isActive
                                        ? cn("bg-white/10 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105", itemConfig.color)
                                        : "bg-white/5 border-transparent text-neutral-500 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <ItemIcon size={16} className={cn(isActive ? "fill-current" : "")} />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {itemConfig.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="w-full h-[450px] md:h-[500px] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 relative group">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentItem.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        {/* Background Backdrop */}
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-out scale-100 group-hover:scale-105"
                            style={{ backgroundImage: `url(${backdropUrl})` }}
                        />

                        {/* Multi-layered Gradient for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-transparent" />

                        {/* Content Over the Backdrop */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 gap-2 md:gap-3">

                            <div className="space-y-2 max-w-2xl pt-10">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl line-clamp-2"
                                >
                                    {currentItem.title}
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                    className="text-neutral-300 text-xs md:text-sm line-clamp-2 font-medium leading-relaxed drop-shadow-md max-w-lg"
                                >
                                    {currentItem.overview}
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="flex items-center gap-3 mt-1"
                            >
                                <HeroActions movieId={currentItem.id} mediaType={currentItem.media_type} />

                                <div className="flex items-center gap-1.5 text-white/80 bg-white/5 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 shadow-lg mt-2">
                                    <Star size={14} className={cn("fill-current", config.color)} />
                                    <span className="font-bold text-sm tabular-nums">{currentItem.vote_average.toFixed(1)}</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Slider Navigation Dots */}
                <div className="absolute bottom-6 right-8 flex items-center gap-3 z-20">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-lg border border-white/10",
                                index === currentIndex
                                    ? "bg-white w-8"
                                    : "bg-white/30 hover:bg-white/60"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full z-20">
                    <motion.div
                        key={currentIndex}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 10, ease: "linear" }}
                        className={cn("h-full", config.bgColor)}
                    />
                </div>
            </div>
        </div>
    );
}
