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
    const hasItems = items.length > 0;

    // Auto-advance slide
    useEffect(() => {
        if (!hasItems) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 10000); // 10 seconds per slide

        return () => clearInterval(timer);
    }, [hasItems, items.length]);

    // Reset timer on interaction
    const handleManualChange = (index: number) => {
        setCurrentIndex(index);
    };

    const handleDragEnd = (event: any, info: any) => {
        if (!hasItems) return;

        if (info.offset.x > 50) {
            // Swipe Right (Previous)
            setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
        } else if (info.offset.x < -50) {
            // Swipe Left (Next)
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }
    };

    if (!hasItems) {
        return (
            <div className="w-full h-[65svh] md:h-[450px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border border-white/10 relative bg-gradient-to-br from-[#111827] to-[#0b1220] flex items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-3">
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">İçerikler Yüklenemedi</h3>
                    <p className="text-sm text-neutral-300 font-medium">
                        TMDB bağlantısı kurulamadı. Geçerli API anahtarı ekledikten sonra içerikler burada görünecek.
                    </p>
                </div>
            </div>
        );
    }

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
            {/* Top Navigation Tabs - External Header - Minimal Design */}
            <div className="w-full px-2">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
                    {items.map((item, index) => {
                        const itemConfig = CATEGORY_CONFIG[item.category];
                        const isActive = index === currentIndex;
                        const ItemIcon = itemConfig.icon;
                        return (
                            <button
                                key={`${item.id}-${item.category}`}
                                onClick={() => handleManualChange(index)}
                                className={cn(
                                    "group relative flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-500 w-full outline-none",
                                    isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                                )}
                            >
                                {/* Minimal Background Highlight for Active */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-bg"
                                        className="absolute inset-0 bg-white/[0.03] rounded-xl"
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                <ItemIcon
                                    size={16}
                                    className={cn(
                                        "relative z-10 transition-all duration-300",
                                        isActive ? itemConfig.color : "text-white"
                                    )}
                                />

                                <span className={cn(
                                    "relative z-10 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] transition-all duration-300 truncate",
                                    isActive ? "text-white" : "text-white"
                                )}>
                                    {itemConfig.label}
                                </span>

                                {/* Active Line Indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className={cn("absolute bottom-0 left-0 right-0 h-[2px] rounded-full w-12 mx-auto", itemConfig.bgColor)}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="w-full h-[65svh] md:h-[450px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border border-white/10 relative group">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentItem.id}-${currentItem.category}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 touch-pan-y"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Background Backdrop */}
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-out scale-110 motion-reduce:scale-100"
                            style={{ backgroundImage: `url(${backdropUrl})` }}
                        />

                        {/* Multi-layered Gradient for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/60 via-transparent to-transparent" />

                        {/* Content Over the Backdrop */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 gap-3 md:gap-4 pb-16 md:pb-10">

                            <div className="space-y-2 max-w-2xl pt-10">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-2 mb-2"
                                >
                                    <span className={cn("px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80")}>
                                        {config.label}
                                    </span>
                                </motion.div>

                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter drop-shadow-2xl line-clamp-2 md:line-clamp-2"
                                >
                                    {currentItem.title}
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                    className="text-neutral-300 text-xs md:text-sm line-clamp-3 md:line-clamp-2 font-medium leading-relaxed drop-shadow-md max-w-lg"
                                >
                                    {currentItem.overview}
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="flex flex-wrap items-center gap-3 mt-1"
                            >
                                <HeroActions movieId={currentItem.id} mediaType={currentItem.media_type} />

                                <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/10 shadow-lg mt-2">
                                    <Star size={14} className={cn("fill-current", config.color)} />
                                    <span className="font-bold text-sm tabular-nums">{currentItem.vote_average.toFixed(1)}</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Slider Navigation Dots - Mobile Optimized */}
                <div className="absolute top-4 right-4 md:bottom-6 md:right-8 md:top-auto flex items-center gap-2 z-20">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-sm",
                                index === currentIndex
                                    ? "bg-white w-6 h-1.5 rounded-full"
                                    : "bg-white/20 w-1.5 h-1.5 rounded-full hover:bg-white/40"
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
