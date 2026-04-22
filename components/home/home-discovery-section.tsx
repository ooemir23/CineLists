"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Film, Tv, TrendingUp, Star, Check, Calendar, Filter, PlayCircle, Shuffle, LayoutGrid, List as ListIcon, Clock, Frown, RefreshCcw, Users, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaCard } from "@/components/media/media-card";

type MenuType = "all" | "movie" | "tv";
type MenuCategory = "trending" | "popular" | "now_playing" | "top_rated" | "upcoming" | "random" | "friends";

type DiscoverItem = {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    poster_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    media_type?: string;
    overview?: string;
    runtime?: number;
    watch_providers?: any;
    friend?: any;
};

const categoryOptions = [
    { id: "trending", label: "Trend", icon: TrendingUp },
    { id: "popular", label: "Popüler", icon: Star },
    { id: "now_playing", label: "Vizyonda", icon: PlayCircle },
    { id: "top_rated", label: "En İyiler", icon: Check },
    { id: "upcoming", label: "Yakında", icon: Calendar },
    { id: "random", label: "Rastgele", icon: Shuffle },
    { id: "friends", label: "Arkadaşlar", icon: Users },
] as const;

const HOME_CATEGORY_LABELS: Record<string, string> = {
    trending: "Trend",
    popular: "Popüler",
    now_playing: "Vizyondaki",
    top_rated: "En İyi",
    upcoming: "Gelecek",
    random: "Rastgele",
    friends: "Arkadaşların İzlediği",
};

const GENRE_OPTIONS = [
    { id: "", label: "Tür" },
    { id: "28", label: "Aksiyon" },
    { id: "35", label: "Komedi" },
    { id: "18", label: "Dram" },
    { id: "27", label: "Korku" },
    { id: "878", label: "Bilim Kurgu" },
    { id: "16", label: "Animasyon" },
    { id: "53", label: "Gerilim" },
];

const YEAR_OPTIONS = ["", "2025", "2024", "2023", "2022", "2021", "2020", "2015", "2010", "2000"];

const RATING_OPTIONS = [
    { id: "", label: "Puan" },
    { id: "8", label: "8+ Puan" },
    { id: "7", label: "7+ Puan" },
    { id: "6", label: "6+ Puan" },
    { id: "5", label: "5+ Puan" },
];

const PROVIDER_OPTIONS = [
    { id: "", label: "Platform" },
    { id: "119", label: "Amazon Prime" },
    { id: "8", label: "Netflix" },
    { id: "337", label: "Disney Plus" },
    { id: "1899", label: "HBO Max (Max)" },
    { id: "532", label: "Exxen" },
    { id: "531", label: "Gain" },
    { id: "1773", label: "TOD" },
    { id: "258", label: "MUBI" },
    { id: "350", label: "Apple TV+" },
    { id: "3", label: "Google Play" },
];

const LANGUAGE_OPTIONS = [
    { id: "", label: "Dil" },
    { id: "tr", label: "Türkçe" },
    { id: "en", label: "İngilizce" },
    { id: "ko", label: "Korece" },
    { id: "es", label: "İspanyolca" },
    { id: "fr", label: "Fransızca" },
    { id: "ja", label: "Japonca" }
];

const COUNTRY_OPTIONS = [
    { id: "", label: "Ülke" },
    { id: "TR", label: "Türkiye" },
    { id: "US", label: "ABD" },
    { id: "GB", label: "İngiltere" },
    { id: "FR", label: "Fransa" },
    { id: "DE", label: "Almanya" },
    { id: "KR", label: "G. Kore" },
    { id: "JP", label: "Japonya" },
    { id: "ES", label: "İspanya" },
    { id: "IT", label: "İtalya" },
];

export function HomeDiscoverySection() {
    const headerRef = useRef<HTMLDivElement>(null);
    const [activeType, setActiveType] = useState<MenuType>("movie");
    const [activeCategory, setActiveCategory] = useState<MenuCategory>("trending");
    const [activeTimeWindow, setActiveTimeWindow] = useState<"day" | "week" | "month">("day");
    
    // Filter states
    const [genre, setGenre] = useState("");
    const [year, setYear] = useState("");
    const [rating, setRating] = useState("");
    const [provider, setProvider] = useState("");
    const [language, setLanguage] = useState("");
    const [country, setCountry] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");

    const [items, setItems] = useState<DiscoverItem[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
        
        if (headerRef.current) {
            const yOffset = -80; // Offset for TopNav
            const y = headerRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    }, [activeType, activeCategory, activeTimeWindow, genre, year, rating, provider, language, country]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            if (page === 1) setIsLoading(true);
            else setIsMoreLoading(true);
            
            try {
                const url = new URL("/api/tmdb/home-discover", window.location.origin);
                url.searchParams.set("type", activeType);
                url.searchParams.set("category", activeCategory);
                url.searchParams.set("timeWindow", activeTimeWindow);
                url.searchParams.set("page", page.toString());
                if (genre) url.searchParams.set("genre", genre);
                if (year) url.searchParams.set("year", year);
                if (rating) url.searchParams.set("rating", rating);
                if (provider) url.searchParams.set("provider", provider);
                if (language) url.searchParams.append("language", language);
                if (country) url.searchParams.append("country", country);

                const res = await fetch(url.toString(), {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const data = await res.json();
                
                if (page === 1) {
                    setItems(data?.results || []);
                } else {
                    setItems(prev => [...prev, ...(data?.results || [])]);
                }
            } catch (err) {
                console.error("Discovery fetch error:", err);
                if (page === 1) setItems([]);
            } finally {
                setIsLoading(false);
                setIsMoreLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [activeType, activeCategory, activeTimeWindow, genre, year, rating, provider, language, country, page]);

    return (
        <section id="home-discover" ref={headerRef} className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-4 md:mt-5">
            {/* Sticky Header Container */}
            <div className="sticky top-[72px] z-40 pb-4 -mx-3 px-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12 transition-all duration-300">
                <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md pointer-events-none border-b border-white/5 opacity-0 group-scroll:opacity-100 transition-opacity" />
                
                {/* Primary Discovery Bar */}
                <div className="flex flex-col lg:flex-row gap-2 lg:items-center mb-3 relative z-10">
                    {/* Type Switcher */}
                    <div className="flex bg-[#1b2334]/90 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:w-auto w-full">
                        <button
                            onClick={() => setActiveType("all")}
                            className={cn(
                                "flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-[1.4rem] text-sm font-black transition-all uppercase tracking-tight",
                                activeType === "all"
                                    ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setActiveType("movie")}
                            className={cn(
                                "flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-[1.4rem] text-sm font-black transition-all uppercase tracking-tight",
                                activeType === "movie"
                                    ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Film size={18} />
                            Film
                        </button>
                        <button
                            onClick={() => setActiveType("tv")}
                            className={cn(
                                "flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-[1.4rem] text-sm font-black transition-all uppercase tracking-tight",
                                activeType === "tv"
                                    ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]"
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            <Tv size={18} />
                            Dizi
                        </button>
                    </div>

                    {/* Category Options */}
                    <div className="flex-1 flex flex-wrap bg-[#1b2334]/90 p-1.5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] gap-1">
                        {categoryOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setActiveCategory(opt.id as MenuCategory)}
                                className={cn(
                                    "flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-[1.4rem] text-[10px] md:text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap",
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

                    {/* View Mode Toggles */}
                    <div className="flex bg-[#1b2334]/90 p-1 rounded-full border border-white/10 backdrop-blur-xl lg:w-auto w-full justify-center shrink-0">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "grid" ? "bg-amber-400 text-black shadow-lg" : "text-neutral-400 hover:text-white"
                            )}
                            title="Izgara"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("compact")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "compact" ? "bg-amber-400 text-black shadow-lg" : "text-neutral-400 hover:text-white"
                            )}
                            title="Kompakt"
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "list" ? "bg-amber-400 text-black shadow-lg" : "text-neutral-400 hover:text-white"
                            )}
                            title="Liste"
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 relative z-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex bg-[#1b2334]/90 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:w-auto w-full">
                        <button
                            onClick={() => setActiveTimeWindow("day")}
                            className={cn(
                                "flex-1 lg:flex-none flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 rounded-[1.4rem] text-sm font-black transition-all uppercase tracking-tight whitespace-nowrap",
                                activeTimeWindow === "day" ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Günün
                        </button>
                        <button
                            onClick={() => setActiveTimeWindow("week")}
                            className={cn(
                                "flex-1 lg:flex-none flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 rounded-[1.4rem] text-sm font-black transition-all uppercase tracking-tight whitespace-nowrap",
                                activeTimeWindow === "week" ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Haftanın
                        </button>
                        <button
                            onClick={() => setActiveTimeWindow("month")}
                            className={cn(
                                "flex-1 lg:flex-none flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 rounded-[1.4rem] text-sm font-black transition-all uppercase tracking-tight whitespace-nowrap",
                                activeTimeWindow === "month" ? "bg-amber-400 text-black shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_8px_24px_-10px_rgba(255,195,0,0.6)]" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Ayın
                        </button>
                    </div>

                    <div className="flex flex-wrap bg-[#1b2334]/90 p-1.5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-w-full gap-1 items-center">
                        {[
                            { value: genre, setter: setGenre, options: GENRE_OPTIONS },
                            { value: year, setter: setYear, options: YEAR_OPTIONS.map(y => ({ id: y, label: y || "Yıl" })) },
                            { value: rating, setter: setRating, options: RATING_OPTIONS },
                            { value: provider, setter: setProvider, options: PROVIDER_OPTIONS },
                            { value: language, setter: setLanguage, options: LANGUAGE_OPTIONS },
                            { value: country, setter: setCountry, options: COUNTRY_OPTIONS },
                        ].map((filter, idx) => (
                            <select 
                                key={idx}
                                value={filter.value} 
                                onChange={(e) => filter.setter(e.target.value)}
                                className={cn(
                                    "bg-transparent text-sm font-black px-4 py-2.5 md:px-6 md:py-3 outline-none cursor-pointer uppercase tracking-tight appearance-none text-center hover:bg-white/5 rounded-[1.2rem] transition-colors",
                                    filter.value !== "" ? "text-amber-400" : "text-white"
                                )}
                            >
                                {filter.options.map(opt => (
                                    <option key={opt.id} value={opt.id} className="bg-[#1b2334] text-white">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ))}

                        <div className="ml-2 md:ml-4 px-2 md:px-4 border-l border-white/10 flex-1">
                            <h2 className="text-sm md:text-2xl font-black text-amber-400 tracking-tighter uppercase italic whitespace-nowrap">
                                {HOME_CATEGORY_LABELS[activeCategory]} {activeType === "all" ? "İçerikler" : activeType === "movie" ? "Filmler" : "Diziler"}
                            </h2>
                        </div>
                    </div>
                </div>

                {(genre || year || rating || provider || language || country) && (
                    <button
                        onClick={() => {
                            setGenre("");
                            setYear("");
                            setRating("");
                            setProvider("");
                            setLanguage("");
                            setCountry("");
                        }}
                        className="lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all uppercase tracking-widest whitespace-nowrap mt-3"
                    >
                        Sıfırla
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className={cn(
                    viewMode === "grid" 
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 md:gap-x-4 gap-y-7 md:gap-y-8"
                        : "flex flex-col gap-4"
                )}>
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className={cn(
                            "rounded-2xl bg-white/5 animate-pulse",
                            viewMode === "grid" ? "aspect-[2/3]" : "h-24 md:h-32 w-full"
                        )} />
                    ))}
                </div>
            ) : (items && items.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 md:py-16 px-4 text-center animate-in fade-in zoom-in duration-700 relative z-10">
                    <div className="relative mb-8 scale-110 md:scale-125">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-amber-400/10 blur-3xl group-hover:bg-amber-400/20 transition-colors" />
                            <div className="relative z-10 flex flex-col items-center">
                                <Film size={44} className="text-neutral-500 mb-1" />
                                <Frown size={28} className="text-amber-400 animate-bounce" />
                            </div>
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-[#0f172a] rounded-full flex items-center justify-center border border-white/10 shadow-2xl shadow-black">
                            <span className="text-xl">🎬</span>
                        </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-4">
                        Aradığınız İçerik <span className="text-amber-400">Bulunamadı</span>
                    </h3>
                    <p className="text-sm md:text-base text-neutral-400 font-bold max-w-md mx-auto leading-relaxed italic">
                        "Seçtiğiniz kriterlere uygun hiçbir yapım sinema arşivlerimizde eşleşmedi. Farklı kombinasyonlar denemeye ne dersiniz?"
                    </p>
                    <button 
                        onClick={() => {
                            setGenre("");
                            setYear("");
                            setRating("");
                            setProvider("");
                            setLanguage("");
                        }}
                        className="mt-10 flex items-center gap-3 px-10 py-4 rounded-full bg-amber-400 text-black font-black text-xs uppercase tracking-[0.2em] hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-amber-400/30 hover:shadow-amber-400/50"
                    >
                        <RefreshCcw size={16} />
                        Filtreleri Temizle
                    </button>
                </div>
            ) : (
                <>
                    <div className={cn(
                        "animate-in fade-in duration-700",
                        viewMode === "grid" && "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6",
                        viewMode === "compact" && "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3 md:gap-4",
                        viewMode === "list" && "flex flex-col gap-4"
                    )}>
                        {items.map((item, idx) => (
                            viewMode === "grid" || viewMode === "compact" ? (
                                <div key={`${item.id}-${idx}`} className="transition-all duration-300">
                                    <MediaCard
                                        id={item.id}
                                        title={item.title || item.name || "Bilinmiyor"}
                                        originalTitle={item.original_title || item.original_name}
                                        posterPath={item.poster_path}
                                        voteAverage={item.vote_average}
                                        type={(item.media_type || activeType) as "movie" | "tv"}
                                        releaseDate={item.release_date || item.first_air_date}
                                        runtime={item.runtime}
                                        overview={item.overview}
                                        watchProviders={item.watch_providers}
                                        friend={item.friend}
                                        compact={viewMode === "compact"}
                                        fullWidth
                                    />
                                </div>
                            ) : (
                                <Link 
                                    key={`${item.id}-${idx}`}
                                    href={`/${item.media_type || activeType}/${item.id}`}
                                    className="flex flex-col md:flex-row items-start md:items-center gap-4 p-3 md:p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                                >
                                    <div className="relative shrink-0 w-24 md:w-28 aspect-[2/3] rounded-xl overflow-hidden border border-white/10">
                                        <img 
                                            src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : "/no-poster.png"} 
                                            alt={item.title || item.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 h-full flex flex-col">
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-[10px] font-black text-black uppercase">
                                                {item.media_type === "tv" ? "DİZİ" : "FİLM"}
                                            </span>
                                            <div className="flex items-center gap-1 text-amber-400">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-sm font-black">{item.vote_average?.toFixed(1)}</span>
                                            </div>
                                            {item.runtime && (
                                                <div className="flex items-center gap-1 text-neutral-400">
                                                    <Clock size={14} />
                                                    <span className="text-sm font-bold">{item.runtime} dk</span>
                                                </div>
                                            )}
                                            <span className="text-sm text-neutral-500 font-bold">
                                                {(item.release_date || item.first_air_date)?.split("-")[0] || "TBA"}
                                            </span>
                                        </div>

                                        <h3 className="text-lg md:text-xl font-black text-white truncate group-hover:text-amber-400 transition-colors">
                                            {item.title || item.name}
                                        </h3>
                                        {(item.original_title || item.original_name) && (item.original_title || item.original_name) !== (item.title || item.name) && (
                                            <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                                {item.original_title || item.original_name}
                                            </p>
                                        )}

                                        <p className="text-sm text-neutral-400 line-clamp-2 md:line-clamp-3 mb-4 font-medium leading-relaxed">
                                            {item.overview || "Bu içerik için henüz bir açıklama eklenmemiş."}
                                        </p>

                                        {/* Watch Providers */}
                                        {item.watch_providers?.flatrate && (
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mr-1">Platformlar:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.watch_providers.flatrate.slice(0, 5).map((provider: any) => (
                                                        <div key={provider.provider_id} className="w-6 h-6 rounded-md overflow-hidden border border-white/10 tooltip" title={provider.provider_name}>
                                                            <img 
                                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                                                                alt={provider.provider_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )
                        ))}
                    </div>

                    {items.length > 0 && (
                        <div className="mt-12 mb-8 flex justify-center">
                            <button
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={isMoreLoading}
                                className={cn(
                                    "px-10 py-4 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3",
                                    isMoreLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {isMoreLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    "Daha Fazla Göster"
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
