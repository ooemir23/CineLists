"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Essential for navigation tracking
import { motion, AnimatePresence } from "framer-motion";
import { Film, Tv, TrendingUp, Star, Check, Calendar, Filter, PlayCircle, Shuffle, LayoutGrid, List as ListIcon, Clock, Frown, RefreshCcw, Users, Grid3X3, ArrowRight, ChevronRight, ChevronLeft, Sparkles, Search, X, ChevronDown } from "lucide-react";
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
    genre_ids?: number[];
};

const categoryOptions = [
    { id: "trending", label: "Trend", icon: TrendingUp },
    { id: "popular", label: "Popüler", icon: Star },
    { id: "now_playing", label: "Vizyonda", icon: PlayCircle },
    { id: "top_rated", label: "En İyiler", icon: Check },
    { id: "upcoming", label: "Takvim", icon: Calendar },
    { id: "random", label: "Rastgele", icon: Shuffle },
    { id: "friends", label: "Arkadaşlar", icon: Users },
] as const;

const HOME_CATEGORY_LABELS: Record<string, string> = {
    trending: "Trend",
    popular: "Popüler",
    now_playing: "Vizyondaki",
    top_rated: "En İyi",
    upcoming: "Takvim",
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
    const userTriggeredRef = useRef(false);
    const [activeType, setActiveType] = useState<MenuType>("movie");
    const [activeCategory, setActiveCategory] = useState<MenuCategory>("trending");
    const [activeTimeWindow, setActiveTimeWindow] = useState<"day" | "week" | "month">("day");
    
    // Dynamic options from TMDB
    const [genreOptions, setGenreOptions] = useState(GENRE_OPTIONS);
    const [providerOptions, setProviderOptions] = useState(PROVIDER_OPTIONS);
    const [languageOptions, setLanguageOptions] = useState(LANGUAGE_OPTIONS);
    const [countryOptions, setCountryOptions] = useState(COUNTRY_OPTIONS);

    // Filter states - updated for multi-selection
    const [genres, setGenres] = useState<string[]>([]);
    const [years, setYears] = useState<string[]>([]);
    const [ratings, setRatings] = useState<string[]>([]);
    const [providers, setProviders] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");

    const [items, setItems] = useState<DiscoverItem[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [activeFilterCategory, setActiveFilterCategory] = useState(0);
    const [userPreferences, setUserPreferences] = useState<{ genres: string[], platforms: string[] } | null>(null);

    // Staging states for filters (only applied when 'Uygula' is clicked)
    const [stagedGenres, setStagedGenres] = useState<string[]>([]);
    const [stagedYears, setStagedYears] = useState<string[]>([]);
    const [stagedRatings, setStagedRatings] = useState<string[]>([]);
    const [stagedProviders, setStagedProviders] = useState<string[]>([]);
    const [stagedLanguages, setStagedLanguages] = useState<string[]>([]);
    const [stagedCountries, setStagedCountries] = useState<string[]>([]);

    // Fetch dynamic filters from TMDB
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await fetch("/api/tmdb/filters");
                const data = await res.json();
                if (data.genres) setGenreOptions([{ id: "", label: "Tür" }, ...data.genres]);
                if (data.providers) setProviderOptions([{ id: "", label: "Platform" }, ...data.providers]);
                if (data.languages) setLanguageOptions([{ id: "", label: "Dil" }, ...data.languages]);
                if (data.countries) setCountryOptions([{ id: "", label: "Ülke" }, ...data.countries]);
            } catch (err) {
                console.error("Error fetching dynamic filters:", err);
            }
        };
        fetchFilters();
        
        const fetchPreferences = async () => {
            try {
                const res = await fetch("/api/user/preferences");
                const data = await res.json();
                setUserPreferences({
                    genres: data.favoriteGenres || [],
                    platforms: data.platforms || []
                });
            } catch (err) {
                console.error("Error fetching preferences:", err);
            }
        };
        fetchPreferences();
    }, []);

    const toggleFilter = (current: string[], setter: (val: string[]) => void, value: string) => {
        markUserTriggered();
        if (value === "") {
            setter([]);
            return;
        }
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
        }
    };

    const applyPersonalizedFilters = async () => {
        markUserTriggered();
        
        const prefs = userPreferences;
        if (!prefs) return;

        if (prefs.genres && prefs.genres.length > 0) {
            // prefs.genres already contains TMDB IDs
            setGenres(prefs.genres);
            setStagedGenres(prefs.genres);
        }
        if (prefs.platforms && prefs.platforms.length > 0) {
            // prefs.platforms already contains TMDB IDs
            setProviders(prefs.platforms);
            setStagedProviders(prefs.platforms);
        }
    };

    const commitFilters = () => {
        setGenres(stagedGenres);
        setYears(stagedYears);
        setRatings(stagedRatings);
        setProviders(stagedProviders);
        setLanguages(stagedLanguages);
        setCountries(stagedCountries);
        setIsFilterSheetOpen(false);
    };

    const resetStaging = () => {
        setStagedGenres(genres);
        setStagedYears(years);
        setStagedRatings(ratings);
        setStagedProviders(providers);
        setStagedLanguages(languages);
        setStagedCountries(countries);
    };

    const clearAllStaged = () => {
        setStagedGenres([]);
        setStagedYears([]);
        setStagedRatings([]);
        setStagedProviders([]);
        setStagedLanguages([]);
        setStagedCountries([]);
    };

    const markUserTriggered = () => {
        userTriggeredRef.current = true;
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
        
        if (headerRef.current && userTriggeredRef.current) {
            const yOffset = -80; // Offset for TopNav
            const y = headerRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    }, [activeType, activeCategory, activeTimeWindow, genres, years, ratings, providers, languages, countries]);

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
                
                if (genres.length > 0) url.searchParams.set("genre", genres.join("|")); // TMDB uses | for OR for genres too
                if (years.length > 0) url.searchParams.set("year", years.join(","));
                if (ratings.length > 0) url.searchParams.set("rating", Math.min(...ratings.map(Number)).toString()); // Take lowest rating for gte
                if (providers.length > 0) url.searchParams.set("provider", providers.join("|")); // TMDB uses | for OR
                if (languages.length > 0) url.searchParams.set("language", languages.join(","));
                if (countries.length > 0) url.searchParams.set("country", countries.join(","));

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
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("Discovery fetch error:", err);
                if (page === 1) setItems([]);
            } finally {
                setIsLoading(false);
                setIsMoreLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [activeType, activeCategory, activeTimeWindow, genres, years, ratings, providers, languages, countries, page]);

    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

    useEffect(() => {
        if (isFilterSheetOpen) {
            resetStaging();
        }
    }, [isFilterSheetOpen]);

    // Close overlays on navigation or global close event
    useEffect(() => {
        const handleClose = () => setIsFilterSheetOpen(false);
        window.addEventListener("close-all-overlays", handleClose);
        return () => window.removeEventListener("close-all-overlays", handleClose);
    }, []);

    const pathname = usePathname();
    useEffect(() => {
        setIsFilterSheetOpen(false);
    }, [pathname]);

    const hasFilters = genres.length > 0 || years.length > 0 || ratings.length > 0 || providers.length > 0 || languages.length > 0 || countries.length > 0;

    // Helper to get labels for selected IDs
    const getSelectedLabels = () => {
        const selected: { category: string, id: string, label: string, setter: (v: string[]) => void, current: string[] }[] = [];
        
        genres.forEach(id => {
            const opt = genreOptions.find(o => o.id === id);
            if (opt) selected.push({ category: "Tür", id, label: opt.label, setter: setGenres, current: genres });
        });
        years.forEach(id => {
            if (id) selected.push({ category: "Yıl", id, label: id, setter: setYears, current: years });
        });
        ratings.forEach(id => {
            const opt = RATING_OPTIONS.find(o => o.id === id);
            if (opt) selected.push({ category: "Puan", id, label: opt.label, setter: setRatings, current: ratings });
        });
        providers.forEach(id => {
            const opt = providerOptions.find(o => o.id === id);
            if (opt) selected.push({ category: "Platform", id, label: opt.label, setter: setProviders, current: providers });
        });
        languages.forEach(id => {
            const opt = languageOptions.find(o => o.id === id);
            if (opt) selected.push({ category: "Dil", id, label: opt.label, setter: setLanguages, current: languages });
        });
        countries.forEach(id => {
            const opt = countryOptions.find(o => o.id === id);
            if (opt) selected.push({ category: "Ülke", id, label: opt.label, setter: setCountries, current: countries });
        });
        
        return selected;
    };

    return (
        <section id="home-discover" ref={headerRef} className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-4 md:mt-5">
            {/* Refined Pro Mobile Filter Overlay */}
            <AnimatePresence>
                {isFilterSheetOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] lg:hidden bg-slate-950/98 backdrop-blur-3xl flex flex-col"
                    >
                        {/* Compact Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                                Filtrele
                            </h3>
                            <button 
                                onClick={() => setIsFilterSheetOpen(false)}
                                className="p-2 -mr-2 text-neutral-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Category Navigation - Horizontal Scroll */}
                        <div className="flex bg-slate-900/30 border-b border-white/5 overflow-x-auto no-scrollbar py-3 px-4 gap-2">
                            {[
                                { label: "Tür", value: stagedGenres },
                                { label: "Platform", value: stagedProviders },
                                { label: "Yıl", value: stagedYears },
                                { label: "Puan", value: stagedRatings },
                                { label: "Dil", value: stagedLanguages },
                                { label: "Ülke", value: stagedCountries },
                            ].map((cat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveFilterCategory(idx)}
                                    className={cn(
                                        "flex-none px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                        activeFilterCategory === idx
                                            ? "bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20"
                                            : cat.value.length > 0 
                                                ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                                                : "bg-white/5 border-white/5 text-neutral-500 hover:text-white"
                                    )}
                                >
                                    {cat.label} {cat.value.length > 0 && `(${cat.value.length})`}
                                </button>
                            ))}
                        </div>

                        {/* Options Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeFilterCategory}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-wrap gap-2 justify-center"
                                >
                                    {([
                                        { value: stagedGenres, setter: setStagedGenres, options: genreOptions },
                                        { value: stagedProviders, setter: setStagedProviders, options: providerOptions },
                                        { value: stagedYears, setter: setStagedYears, options: YEAR_OPTIONS.map(y => ({ id: y, label: y || "Tümü" })) },
                                        { value: stagedRatings, setter: setStagedRatings, options: RATING_OPTIONS },
                                        { value: stagedLanguages, setter: setStagedLanguages, options: languageOptions },
                                        { value: stagedCountries, setter: setStagedCountries, options: countryOptions },
                                    ][activeFilterCategory]).options.map((opt: any) => {
                                        const cat = [
                                            { value: stagedGenres, setter: setStagedGenres },
                                            { value: stagedProviders, setter: setStagedProviders },
                                            { value: stagedYears, setter: setStagedYears },
                                            { value: stagedRatings, setter: setStagedRatings },
                                            { value: stagedLanguages, setter: setStagedLanguages },
                                            { value: stagedCountries, setter: setStagedCountries },
                                        ][activeFilterCategory];
                                        
                                        const isSelected = cat.value.includes(opt.id);
                                        
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => toggleFilter(cat.value, cat.setter, opt.id)}
                                                className={cn(
                                                    "px-5 py-3 rounded-2xl text-[11px] font-bold transition-all border",
                                                    isSelected
                                                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xl shadow-amber-400/20"
                                                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Selection Summary / Sana Özel Strip */}
                        <div className="px-6 py-5 bg-amber-400/5 border-t border-white/10 flex items-center justify-between backdrop-blur-xl">
                             <div className="flex flex-col flex-1 min-w-0 pr-4">
                                {stagedGenres.length + stagedProviders.length + stagedYears.length + stagedRatings.length + stagedLanguages.length + stagedCountries.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Seçili Filtreler</span>
                                            <button 
                                                onClick={clearAllStaged}
                                                className="p-1 text-rose-500 active:scale-90 transition-transform"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 max-h-12 overflow-y-auto no-scrollbar">
                                            {[
                                                ...stagedGenres.map(id => ({ id, label: genreOptions.find(o => o.id === id)?.label, setter: setStagedGenres, current: stagedGenres })),
                                                ...stagedProviders.map(id => ({ id, label: providerOptions.find(o => o.id === id)?.label, setter: setStagedProviders, current: stagedProviders })),
                                                ...stagedYears.map(y => ({ id: y, label: y, setter: setStagedYears, current: stagedYears })),
                                                ...stagedRatings.map(r => ({ id: r, label: `${r}+ Puan`, setter: setStagedRatings, current: stagedRatings })),
                                                ...stagedLanguages.map(id => ({ id, label: languageOptions.find(o => o.id === id)?.label, setter: setStagedLanguages, current: stagedLanguages })),
                                                ...stagedCountries.map(id => ({ id, label: countryOptions.find(o => o.id === id)?.label, setter: setStagedCountries, current: stagedCountries })),
                                            ].filter(o => o.label).map((opt, i, arr) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => opt.setter(opt.current.filter(v => v !== opt.id))}
                                                    className="flex items-center gap-1.5 text-[9px] font-black text-neutral-400 hover:text-white active:text-rose-500 transition-colors uppercase tracking-wider"
                                                >
                                                    {opt.label}
                                                    {i < arr.length - 1 && <span className="text-neutral-700/50">•</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400">
                                                <Sparkles size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Özel Öneriler</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider truncate">
                                            {userPreferences ? (
                                                [
                                                    ...userPreferences.genres.map(id => genreOptions.find(o => o.id === id || o.label.toLowerCase() === id.toLowerCase())?.label || id),
                                                    ...userPreferences.platforms.map(id => providerOptions.find(o => o.id === id || o.label.toLowerCase() === id.toLowerCase())?.label || id)
                                                ].filter(val => val && !/^\d+$/.test(val)).join(" • ") || "Zevkine uygun içerikler"
                                            ) : "Zevkine uygun içerikler"}
                                        </span>
                                    </>
                                )}
                             </div>
                             <button 
                                onClick={commitFilters}
                                className="flex-none px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-amber-400/10"
                             >
                                Uygula
                             </button>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 bg-slate-950">
                            <button 
                                onClick={clearAllStaged}
                                className="py-4.5 rounded-2xl bg-white/5 border border-white/5 text-neutral-400 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                            >
                                Sıfırla
                            </button>
                            <button 
                                onClick={commitFilters}
                                className="py-4.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                            >
                                Uygula
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Header Container */}
            <div className="sticky top-[72px] z-40 pb-2 md:pb-4 -mx-3 px-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12">
                
                {/* Primary Discovery Bar */}
                <div className="flex flex-col lg:flex-row gap-2 lg:items-center mb-2 md:mb-3 relative z-10">
                    {/* Left: Type Switcher */}
                    <div className="lg:w-[320px] shrink-0">
                        <div className="flex bg-[#1b2334]/90 p-1.5 rounded-full border border-white/10 backdrop-blur-xl w-full">
                            {["all", "movie", "tv"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        markUserTriggered();
                                        setActiveType(t as any);
                                    }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-[10px] md:text-sm font-black transition-all uppercase tracking-tight",
                                        activeType === t ? "bg-amber-400 text-black shadow-lg" : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    {t === "movie" ? <Film size={14} className="md:w-[18px] md:h-[18px]" /> : t === "tv" ? <Tv size={14} className="md:w-[18px] md:h-[18px]" /> : null}
                                    {t === "all" ? "Tümü" : t === "movie" ? "Film" : "Dizi"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Category Options */}
                    <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 overflow-hidden">
                        <div className="flex-1 flex bg-[#1b2334]/90 p-1.5 rounded-full border border-white/10 backdrop-blur-xl gap-1 overflow-x-auto hide-scrollbar">
                            {categoryOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        markUserTriggered();
                                        setActiveCategory(opt.id as MenuCategory);
                                    }}
                                    className={cn(
                                        "flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-[9px] md:text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap",
                                        activeCategory === opt.id
                                            ? "bg-white/10 text-white border border-white/15"
                                            : "text-neutral-500 hover:text-white"
                                    )}
                                >
                                    <opt.icon size={12} className={cn("md:w-3.5 md:h-3.5", activeCategory === opt.id ? "text-amber-400" : "")} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Filter Trigger */}
                        <button
                            onClick={() => setIsFilterSheetOpen(true)}
                            className="lg:hidden relative flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400 text-black shadow-lg shadow-amber-400/20 active:scale-90 transition-all shrink-0"
                        >
                            <Filter size={20} strokeWidth={2.5} />
                            {hasFilters && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-in zoom-in duration-300">
                                    {genres.length + years.length + ratings.length + providers.length + languages.length + countries.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Right: View Mode Toggles */}
                    <div className="hidden lg:flex lg:w-[260px] justify-end shrink-0 pl-4">
                        <div className="flex bg-[#1b2334]/90 p-1.5 rounded-full border border-white/10 backdrop-blur-xl w-full">
                            {[
                                { id: "grid", icon: LayoutGrid, label: "Izgara" },
                                { id: "compact", icon: Grid3X3, label: "Kompakt" },
                                { id: "list", icon: ListIcon, label: "Liste" },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setViewMode(mode.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all",
                                        viewMode === mode.id 
                                            ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" 
                                            : "text-neutral-500 hover:text-white hover:bg-white/5"
                                    )}
                                    title={mode.label}
                                >
                                    <mode.icon size={16} />
                                    <span className="hidden 2xl:inline">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop-only Filters Row */}
                <div className="hidden lg:flex flex-col lg:flex-row items-stretch lg:items-center gap-2 md:gap-3 relative z-10">
                    {/* Left: Time Switcher */}
                    <div className="lg:w-[320px] shrink-0">
                        <div className="flex bg-[#1b2334]/90 p-1.5 rounded-full border border-white/10 backdrop-blur-xl w-full">
                            {["day", "week", "month"].map(tw => (
                                <button key={tw} onClick={() => {
                                    markUserTriggered();
                                    setActiveTimeWindow(tw as any);
                                }} className={cn("flex-1 flex items-center justify-center px-3 py-2.5 rounded-full text-[10px] md:text-sm font-black transition-all uppercase tracking-tight whitespace-nowrap", activeTimeWindow === tw ? "bg-amber-400 text-black" : "text-neutral-400 hover:text-white")}>
                                    {tw === "day" ? "Günün" : tw === "week" ? "Haftanın" : "Ayın"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Filters */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 flex bg-[#1b2334]/90 p-1.5 rounded-full border border-white/10 backdrop-blur-xl gap-0.5 md:gap-1 items-center lg:overflow-visible overflow-x-auto hide-scrollbar">
                            {[
                                { label: "Tür", value: genres, setter: setGenres, options: genreOptions },
                                { label: "Yıl", value: years, setter: setYears, options: YEAR_OPTIONS.map(y => ({ id: y, label: y || "Yıl" })) },
                                { label: "Puan", value: ratings, setter: setRatings, options: RATING_OPTIONS },
                                { label: "Platform", value: providers, setter: setProviders, options: providerOptions },
                                { label: "Dil", value: languages, setter: setLanguages, options: languageOptions },
                                { label: "Ülke", value: countries, setter: setCountries, options: countryOptions },
                            ].map((filter, idx) => (
                                <FilterDropdown 
                                    key={idx}
                                    label={filter.label}
                                    selected={filter.value}
                                    options={filter.options}
                                    onToggle={(val) => toggleFilter(filter.value, filter.setter, val)}
                                />
                            ))}
                        </div>

                        {/* "Sana Özel" Button - Now distinct and outside the main bar */}
                        <button
                            onClick={applyPersonalizedFilters}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border-2 border-amber-400/30 hover:border-amber-400 transition-all font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shrink-0 shadow-lg shadow-amber-400/5 group"
                        >
                            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                            Sana Özel
                        </button>
                    </div>

                    {/* Right: Reset Button Container */}
                    <div className="lg:w-[260px] flex justify-end shrink-0 pl-4">
                        {hasFilters && (
                            <button
                                onClick={() => {
                                    setGenres([]); setYears([]); setRatings([]); setProviders([]); setLanguages([]); setCountries([]);
                                    markUserTriggered();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500/10 to-rose-600/20 hover:from-rose-500/20 hover:to-rose-600/30 text-rose-500 border border-rose-500/20 transition-all font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-rose-500/5 hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-right-4 duration-300"
                            >
                                <RefreshCcw size={16} />
                                Seçimleri Sıfırla
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filter Tags */}
                {hasFilters && (
                    <div className="hidden lg:flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        {getSelectedLabels().map((tag, idx) => (
                            <button
                                key={`${tag.id}-${idx}`}
                                onClick={() => tag.setter(tag.current.filter(id => id !== tag.id))}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all text-[10px] font-black uppercase tracking-widest group"
                            >
                                <span className="text-red-500/50">{tag.category}:</span>
                                <span>{tag.label}</span>
                                <X size={12} className="group-hover:scale-125 transition-transform" />
                            </button>
                        ))}
                    </div>
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
                            setGenres([]);
                            setYears([]);
                            setRatings([]);
                            setProviders([]);
                            setLanguages([]);
                            setCountries([]);
                            markUserTriggered();
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
                                        genres={item.genre_ids?.map((id: number) => genreOptions.find(o => o.id === id.toString())?.label).filter((l): l is string => Boolean(l)).slice(0, 2)}
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
                                            {item.genre_ids?.map((id: number) => {
                                                const gLabel = genreOptions.find(o => o.id === id.toString())?.label;
                                                return gLabel ? (
                                                    <span key={id} className="px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-[10px] font-black text-amber-400 uppercase">
                                                        {gLabel}
                                                    </span>
                                                ) : null;
                                            }).slice(0, 3)}
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

// Inner Component for Searchable Filter Dropdown
function FilterDropdown({ label, selected, options, onToggle }: { label: string, selected: string[], options: { id: string, label: string }[], onToggle: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 100); // Limit to 100 for performance

    return (
        <div className="relative shrink-0 flex-1 min-w-[80px]" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full bg-transparent font-black px-1 py-1.5 md:py-2 outline-none cursor-pointer uppercase tracking-tight text-center hover:bg-white/5 rounded-full transition-all flex flex-col items-center justify-center leading-none min-h-[40px] md:min-h-[44px]",
                    selected.length > 0 ? "text-amber-400" : "text-neutral-500 hover:text-white"
                )}
            >
                {selected.length > 0 ? (
                    <>
                        <span className="text-[8px] md:text-[11px] mb-0.5">{selected.length} {label}</span>
                        <span className="text-[7px] md:text-[9px] opacity-70 font-bold">Seçili</span>
                    </>
                ) : (
                    <span className="text-[9px] md:text-sm">{label}</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1b2334] border border-white/10 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative mb-3">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input 
                            autoFocus
                            type="text"
                            placeholder="Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-neutral-600 outline-none focus:border-amber-400/50 transition-colors"
                        />
                    </div>

                    {selected.length > 0 && (
                        <button
                            onClick={() => onToggle("")}
                            className="w-full mb-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/10 flex items-center justify-center gap-2"
                        >
                            <X size={12} />
                            {selected.length} Seçimi Kaldır
                        </button>
                    )}
                    
                    <div className="max-h-64 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        onToggle(opt.id);
                                        setSearchTerm(""); // Clear search on selection
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                        selected.includes(opt.id) 
                                            ? "bg-amber-400 text-black" 
                                            : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span>{opt.label}</span>
                                    {selected.includes(opt.id) && <Check size={14} />}
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Sonuç Bulunamadı</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
