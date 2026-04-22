"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Film, Tv, TrendingUp, Star, Check, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaCard } from "@/components/media/media-card";

type MenuType = "movie" | "tv";
type MenuCategory = "trending" | "popular" | "top_rated" | "upcoming" | "discover";

type DiscoverItem = {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
};

const categoryOptions = [
    { id: "trending", label: "Trend", icon: TrendingUp },
    { id: "popular", label: "Populer", icon: Star },
    { id: "top_rated", label: "En Iyiler", icon: Check },
    { id: "upcoming", label: "Yakinda", icon: Calendar },
    { id: "discover", label: "Kesfet", icon: Filter },
] as const;

const HOME_CATEGORY_LABELS: Record<MenuCategory, string> = {
    trending: "Trend",
    popular: "Populer",
    top_rated: "En Iyiler",
    upcoming: "Yakinda",
    discover: "Kesfet",
};

export function HomeDiscoverySection() {
    const [activeType, setActiveType] = useState<MenuType>("movie");
    const [activeCategory, setActiveCategory] = useState<MenuCategory>("trending");
    const [items, setItems] = useState<DiscoverItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/tmdb/home-discover?type=${activeType}&category=${activeCategory}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const data = await res.json();
                setItems(data?.results || []);
            } catch {
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [activeType, activeCategory]);

    return (
        <section id="home-discover" className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-4 md:mt-5">
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center mb-4 md:mb-6">
                <div className="flex bg-[#1b2334]/90 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl w-full xl:w-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <button
                        onClick={() => setActiveType("movie")}
                        className={cn(
                            "flex-1 xl:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-[1.4rem] text-base font-black transition-all uppercase tracking-tight",
                            activeType === "movie"
                                ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]"
                                : "text-neutral-400 hover:text-white"
                        )}
                    >
                        <Film size={20} />
                        Film
                    </button>
                    <button
                        onClick={() => setActiveType("tv")}
                        className={cn(
                            "flex-1 xl:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-[1.4rem] text-base font-black transition-all uppercase tracking-tight",
                            activeType === "tv"
                                ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]"
                                : "text-neutral-400 hover:text-white"
                        )}
                    >
                        <Tv size={20} />
                        Dizi
                    </button>
                </div>

                <div className="flex-1 flex bg-[#1b2334]/90 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {categoryOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setActiveCategory(opt.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-[1.4rem] text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap",
                                activeCategory === opt.id
                                    ? "bg-white/10 text-white border border-white/15"
                                    : "text-neutral-500 hover:text-white"
                            )}
                        >
                            <opt.icon size={14} className={activeCategory === opt.id ? "text-amber-400" : ""} />
                            {opt.label}
                        </button>
                    ))}
                </div>

                <Link
                    href={`/explore/${activeType}/${activeCategory}`}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all bg-[#3a4353] text-white hover:bg-[#4a5568] border border-white/10"
                >
                    <Filter size={16} />
                    Filtrele
                </Link>
            </div>

            <div className="mb-4 md:mb-6">
                <nav className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">
                    <span>KESFET</span>
                    <span>/</span>
                    <span className="text-amber-400">{activeType === "movie" ? "FILM" : "DIZI"}</span>
                    <span>/</span>
                    <span className="text-white">{activeCategory.toUpperCase()}</span>
                </nav>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                    {HOME_CATEGORY_LABELS[activeCategory]} {activeType === "movie" ? "Filmler" : "Diziler"}
                </h2>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 md:gap-x-4 gap-y-7 md:gap-y-8">
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 md:gap-x-4 gap-y-7 md:gap-y-8">
                    {items.slice(0, 12).map((item) => (
                        <MediaCard
                            key={item.id}
                            id={item.id}
                            title={item.title || item.name || "Bilinmiyor"}
                            posterPath={item.poster_path}
                            voteAverage={item.vote_average}
                            type={activeType}
                            releaseDate={item.release_date || item.first_air_date}
                            fullWidth
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
