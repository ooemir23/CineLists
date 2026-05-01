"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Calendar, TrendingUp, Trophy, ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { HeroActions } from "./hero-actions";
import { cn } from "@/lib/utils";

type CategoryType = "trending" | "upcoming" | "tv" | "popular" | "personalized" | "followed";

interface HeroItem {
    id: number;
    title: string;
    overview: string;
    backdrop_path: string | null;
    poster_path?: string | null;
    vote_average: number;
    media_type: "movie" | "tv";
    category: CategoryType;
    eventLabel?: string;
    metaLabel?: string;
    platforms?: string[];
    platformLogos?: { name: string; logoPath: string | null }[];
}

interface HeroSliderProps {
    items: HeroItem[];
    friendPopularIds?: number[];
}

const CATEGORY_CONFIG = {
    trending: { label: "Günün En Gözdesi", icon: Star, color: "text-amber-400", bgColor: "bg-amber-400" },
    upcoming: { label: "Takvim", icon: Calendar, color: "text-blue-400", bgColor: "bg-blue-400" },
    tv: { label: "Popüler Dizi", icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-400" },
    popular: { label: "Haftanın Filmi", icon: Trophy, color: "text-purple-400", bgColor: "bg-purple-400" },
    personalized: { label: "Size Özel Öneri", icon: Trophy, color: "text-rose-400", bgColor: "bg-rose-400" },
    followed: { label: "Senin İçin", icon: Star, color: "text-cyan-300", bgColor: "bg-cyan-400" },
};

const EVENT_LABELS: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
    "Yeni Bolum": { label: "Yeni Bölüm", icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    "Bolum Yakinda": { label: "Bölüm Yakında", icon: Calendar, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    "Vizyona Girdi": { label: "Vizyona Girdi", icon: Star, color: "text-amber-400", bgColor: "bg-amber-500/10" },
    "Platformda Yayinda": { label: "Platformda Yayında", icon: TrendingUp, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
    "Platformunda Yeni": { label: "Platformunda Yeni", icon: TrendingUp, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
    "Bugun Yayinda": { label: "Bugün Yayında", icon: Star, color: "text-amber-300", bgColor: "bg-amber-500/10" },
    "Devam Et": { label: "Devam Et", icon: Play, color: "text-emerald-300", bgColor: "bg-emerald-500/10" },
    "Arkadaslarinda Yukseldi": { label: "Popüler", icon: TrendingUp, color: "text-rose-300", bgColor: "bg-rose-500/10" },
};

export function HeroSlider({ items, friendPopularIds = [] }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isManual, setIsManual] = useState(false);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const hasItems = items.length > 0;

    const goNext = useCallback(() => {
        if (!hasItems) return;
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % items.length);
    }, [hasItems, items.length]);

    const goPrev = useCallback(() => {
        if (!hasItems) return;
        setDirection(-1);
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    }, [hasItems, items.length]);

    useEffect(() => {
        if (!hasItems || isManual) return;
        const timer = setInterval(goNext, 12000);
        return () => clearInterval(timer);
    }, [hasItems, isManual, goNext]);

    const handleManualChange = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setIsManual(true);
        setCurrentIndex(index);
    };

    if (!hasItems) {
        return (
            <div className="w-full h-full rounded-[3rem] overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center p-8 text-center">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <Info className="w-8 h-8 text-neutral-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">Yükleniyor...</h3>
                </div>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    const categoryConfig = CATEGORY_CONFIG[currentItem.category];
    const eventMeta = currentItem.eventLabel ? EVENT_LABELS[currentItem.eventLabel] : null;
    const isFriendsPopular = friendPopularIds.includes(currentItem.id);

    const backdropUrl = currentItem.backdrop_path
        ? `https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`
        : "/placeholder-hero.jpg";

    return (
        <div className="relative w-full h-full group overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950 shadow-2xl">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                >
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.15 }}
                        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-[#020617]/20 to-transparent z-10" />
                    <div className="absolute inset-0 bg-black/20 z-10" />

                    <div className="absolute inset-0 z-20 flex flex-col p-6 md:p-8 lg:p-10">
                        {/* Top Metadata Tags */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="flex flex-wrap items-center justify-between gap-3 w-full"
                        >
                            <div className="flex flex-wrap gap-2 items-center">
                                {eventMeta && (
                                    <Link 
                                        href={`/${currentItem.media_type}/${currentItem.id}`}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 hover:brightness-125",
                                            eventMeta.bgColor, eventMeta.color
                                        )}
                                    >
                                        {eventMeta.label}
                                    </Link>
                                )}
                                <Link 
                                    href={currentItem.category === 'upcoming' ? '/calendar' : `/${currentItem.media_type}`}
                                    className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 hover:bg-white/20"
                                >
                                    <categoryConfig.icon className={cn("w-3 h-3", categoryConfig.color)} />
                                    {categoryConfig.label}
                                </Link>
                                <Link 
                                    href={`/${currentItem.media_type}/${currentItem.id}`}
                                    className="px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-400/20 backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 hover:bg-amber-400/30"
                                >
                                    <Star className="w-3 h-3 fill-current" />
                                    {currentItem.vote_average.toFixed(1)}
                                </Link>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Watch Platforms */}
                                {(currentItem.platformLogos && currentItem.platformLogos.length > 0) && (
                                    <div className="hidden md:flex items-center gap-1.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 transition-all hover:bg-black/60 cursor-pointer">
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mr-1">İzle:</span>
                                        <div className="flex -space-x-2">
                                            {currentItem.platformLogos.map((p, i) => (
                                                <div key={i} className="relative w-5 h-5 rounded-full overflow-hidden border border-white/20 shadow-lg ring-1 ring-black/50" title={p.name}>
                                                    {p.logoPath ? (
                                                        <Image
                                                            src={`https://image.tmdb.org/t/p/w92${p.logoPath}`}
                                                            alt={p.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[8px]">{p.name[0]}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trailer Button moved to top right */}
                                <HeroActions movieId={currentItem.id} mediaType={currentItem.media_type} />
                            </div>
                        </motion.div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex flex-col items-start gap-8">
                                <div className="max-w-4xl space-y-6">
                                    <Link href={`/${currentItem.media_type}/${currentItem.id}`} className="space-y-4 block group/content">
                                        <motion.h2
                                            initial={{ y: 30, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3, duration: 0.6 }}
                                            className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl italic uppercase group-hover/content:text-amber-400 transition-colors"
                                        >
                                            {currentItem.title}
                                        </motion.h2>
                                        <motion.p
                                            initial={{ y: 30, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4, duration: 0.6 }}
                                            className="text-lg text-neutral-300 font-bold max-w-2xl line-clamp-3 leading-relaxed drop-shadow-md border-l-4 border-amber-400 pl-6 group-hover/content:border-white transition-colors"
                                        >
                                            {currentItem.overview}
                                        </motion.p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Premium Controls (Now on edges and visible on hover) */}
            <div className="absolute inset-y-0 left-0 right-0 z-30 pointer-events-none flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); setIsManual(true); }}
                    className="w-12 h-12 rounded-full bg-black/40 hover:bg-amber-400 border border-white/10 hover:border-amber-400 backdrop-blur-2xl flex items-center justify-center text-white hover:text-slate-950 transition-all pointer-events-auto hover:scale-110 active:scale-95 group/btn shadow-2xl"
                    aria-label="Önceki"
                >
                    <ChevronLeft className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); goNext(); setIsManual(true); }}
                    className="w-12 h-12 rounded-full bg-black/40 hover:bg-amber-400 border border-white/10 hover:border-amber-400 backdrop-blur-2xl flex items-center justify-center text-white hover:text-slate-950 transition-all pointer-events-auto hover:scale-110 active:scale-95 group/btn shadow-2xl"
                    aria-label="Sonraki"
                >
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="absolute bottom-8 right-12 z-30 flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleManualChange(index)}
                            className={cn(
                                "transition-all duration-500",
                                index === currentIndex
                                    ? "bg-amber-400 w-8 h-2 rounded-full"
                                    : "bg-white/20 w-2 h-2 rounded-full hover:bg-white/40"
                            )}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
                <div className="text-[10px] font-black text-white/50 uppercase tracking-widest tabular-nums bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="text-amber-400">{String(currentIndex + 1).padStart(2, '0')}</span> / {String(items.length).padStart(2, '0')}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5 z-40 overflow-hidden">
                <motion.div
                    key={currentIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 12, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                />
            </div>
        </div>
    );
}
