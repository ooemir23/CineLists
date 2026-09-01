"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    X,
    Search,
    Film,
    Tv,
    Star,
    Camera,
    Loader2,
    Scissors,
    SlidersHorizontal,
    Calendar,
    Sparkles,
    Check,
    History,
    ChevronDown,
    Trash2,
    User as UserIcon,
    Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { createPortal } from "react-dom";

// Portal helper component
const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;
    return createPortal(children, document.body);
};

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

const COUNTRIES = [
    { code: "TR", name: "Türkiye", flag: "🇹🇷" },
    { code: "US", name: "Amerika", flag: "🇺🇸" },
    { code: "GB", name: "İngiltere", flag: "🇬🇧" },
    { code: "DE", name: "Almanya", flag: "🇩🇪" },
    { code: "FR", name: "Fransa", flag: "🇫🇷" },
    { code: "ES", name: "İspanya", flag: "🇪🇸" },
    { code: "IT", name: "İtalya", flag: "🇮🇹" },
    { code: "JP", name: "Japonya", flag: "🇯🇵" },
    { code: "KR", name: "Güney Kore", flag: "🇰🇷" },
];

const POPULAR_SEARCHES = [
    "Deadpool",
    "Stranger Things",
    "The Last of Us",
    "Oppenheimer",
    "Dune",
    "Breaking Bad",
    "Game of Thrones",
    "Interstellar"
];

const RECENT_SEARCHES_KEY = "cinelists_recent_searches";

export function MediaFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [isOcrLoading, setIsOcrLoading] = useState(false);
    
    // Crop states for OCR
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<any>();
    const [completedCrop, setCompletedCrop] = useState<any>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [type, setType] = useState(searchParams.get("type") || "");
    const [year, setYear] = useState(searchParams.get("year") || "");
    const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [country, setCountry] = useState(searchParams.get("country") || "TR");
    const [selectedProviders, setSelectedProviders] = useState<string[]>(
        searchParams.get("provider")?.split(",").filter(Boolean) || []
    );
    const [selectedGenres, setSelectedGenres] = useState<string[]>(
        searchParams.get("genre")?.split(",").filter(Boolean) || []
    );
    const [isInitialRender, setIsInitialRender] = useState(true);

    // Modal state
    const [activeModal, setActiveModal] = useState<"provider" | "genre" | "year_rating" | "country" | null>(null);

    // Live search suggestions & recent searches
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSuggestLoading, setIsSuggestLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [providerSearch, setProviderSearch] = useState("");

    // Dynamic data from TMDB
    const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
    const [providers, setProviders] = useState<{ id: string; name: string; logo: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored).slice(0, 8));
            }
        } catch {
            // Ignore
        }
    }, []);

    const saveRecentSearch = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed || trimmed.length < 2) return;
        try {
            const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
            setRecentSearches(updated);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch {
            // Ignore
        }
    };

    const removeRecentSearch = (term: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = recentSearches.filter(s => s !== term);
        setRecentSearches(updated);
        try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch {
            // Ignore
        }
    };

    const clearAllRecentSearches = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch {
            // Ignore
        }
    };

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Live suggestion fetch
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setSuggestions([]);
            setIsSuggestLoading(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsSuggestLoading(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(query.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
                }
            } catch {
                setSuggestions([]);
            } finally {
                setIsSuggestLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // Handle image capture OCR
    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const cropWidth = width * 0.8;
        const cropHeight = height * 0.2;
        setCrop({
            unit: 'px',
            x: (width - cropWidth) / 2,
            y: (height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
        });
    };

    const handleCropAndScan = async () => {
        if (!completedCrop || !imageRef.current || completedCrop.width === 0 || completedCrop.height === 0) {
            alert("Lütfen taranacak yazıyı seçin.");
            return;
        }

        try {
            setIsOcrLoading(true);

            const canvas = document.createElement('canvas');
            const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
            const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
            canvas.width = completedCrop.width * scaleX;
            canvas.height = completedCrop.height * scaleY;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error("Canvas context is null");

            ctx.drawImage(
                imageRef.current,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY
            );

            const croppedImageUrl = canvas.toDataURL('image/jpeg', 1.0);
            setCropImageSrc(null);

            const { default: Tesseract } = await import("tesseract.js");
            const result = await Tesseract.recognize(croppedImageUrl, 'tur+eng');

            const rawText = result.data.text;
            if (rawText) {
                const cleanedText = rawText.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ \n]/g, ' ');
                const lines = cleanedText.split('\n')
                    .map(l => l.trim().replace(/\s+/g, ' '))
                    .filter(l => l.length > 2)
                    .filter(l => !/^[0-9\s]+$/.test(l));
                
                if (lines.length > 0) {
                    const searchQuery = lines.slice(0, 2).join(" ");
                    setQuery(searchQuery);
                    saveRecentSearch(searchQuery);
                } else {
                    alert("Seçtiğiniz alanda okunabilir bir film/dizi ismi bulunamadı.");
                }
            } else {
                alert("Seçtiğiniz alanda metin bulunamadı.");
            }
        } catch (error) {
            console.error("OCR Error:", error);
            alert("Görsel taranırken bir hata oluştu.");
            setCropImageSrc(null);
        } finally {
            setIsOcrLoading(false);
        }
    };

    // Fetch genres and providers from TMDB
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                setLoading(true);
                const genreType = type || "movie";
                const [genreRes, providerRes] = await Promise.all([
                    fetch(`/api/tmdb/genres?type=${genreType}`),
                    fetch(`/api/tmdb/providers?type=${genreType}&country=${country}`)
                ]);

                if (genreRes.ok) {
                    const genreData = await genreRes.json();
                    setGenres(genreData.genres || []);
                }
                if (providerRes.ok) {
                    const providerData = await providerRes.json();
                    setProviders(providerData.providers || []);
                }
            } catch (error) {
                console.error("Error fetching filter data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilterData();
    }, [type, country]);

    // Live filtering: update URL when values change
    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (type) params.set("type", type);
            else params.delete("type");

            if (year) params.set("year", year);
            else params.delete("year");

            if (minRating) params.set("rating", minRating);
            else params.delete("rating");

            if (query && query.length >= 2) {
                params.set("q", query);
            } else {
                params.delete("q");
            }

            if (country && country !== "TR") params.set("country", country);
            else params.delete("country");

            if (selectedProviders.length > 0) params.set("provider", selectedProviders.join(","));
            else params.delete("provider");

            if (selectedGenres.length > 0) params.set("genre", selectedGenres.join(","));
            else params.delete("genre");

            const newUrl = `${pathname}?${params.toString()}`;
            if (newUrl !== `${pathname}?${searchParams.toString()}`) {
                router.push(newUrl, { scroll: false });
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [type, year, minRating, country, selectedProviders, selectedGenres, query, pathname, router, searchParams, isInitialRender]);

    const hasActiveFilters = Boolean(
        year ||
        minRating ||
        (country && country !== "TR") ||
        selectedProviders.length > 0 ||
        selectedGenres.length > 0 ||
        type
    );

    const activeFilterCount = (
        (type ? 1 : 0) +
        (year ? 1 : 0) +
        (minRating ? 1 : 0) +
        (country !== "TR" ? 1 : 0) +
        selectedProviders.length +
        selectedGenres.length
    );

    const handleClear = () => {
        setType("");
        setYear("");
        setMinRating("");
        setQuery("");
        setCountry("TR");
        setSelectedProviders([]);
        setSelectedGenres([]);
        router.push(pathname);
    };

    const toggleProvider = (providerId: string) => {
        setSelectedProviders(prev =>
            prev.includes(providerId)
                ? prev.filter(id => id !== providerId)
                : [...prev, providerId]
        );
    };

    const toggleGenre = (genreId: string) => {
        setSelectedGenres(prev =>
            prev.includes(genreId)
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearchFocused(false);
        if (query.trim()) {
            saveRecentSearch(query.trim());
            const params = new URLSearchParams(searchParams.toString());
            params.set("q", query.trim());
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    const handleSelectSuggestion = (s: any) => {
        setIsSearchFocused(false);
        if (s.name) saveRecentSearch(s.name);
        if (s.type === "person") {
            router.push(`/person/${s.id}`);
        } else if (s.type === "movie" || s.type === "tv") {
            router.push(`/${s.type}/${s.id}`);
        } else if (s.type === "user") {
            router.push(`/profile/${s.id}`);
        } else {
            setQuery(s.name);
        }
    };

    const handleSelectQueryTag = (term: string) => {
        setQuery(term);
        saveRecentSearch(term);
        setIsSearchFocused(false);
    };

    const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

    const filteredProviders = useMemo(() => {
        if (!providerSearch.trim()) return providers;
        return providers.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase()));
    }, [providers, providerSearch]);

    return (
        <div className="relative space-y-3">
            {/* ═════════ 1. PRIMARY SEARCH BAR (TOP & PROMINENT) ═════════ */}
            <div ref={searchContainerRef} className="relative z-30">
                <form onSubmit={handleSearchSubmit}>
                    <div className={cn(
                        "relative flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-900 border rounded-2xl px-4 py-3 transition-all duration-300 shadow-xl backdrop-blur-xl",
                        isSearchFocused
                            ? "border-amber-400/80 ring-2 ring-amber-400/20 shadow-amber-400/5 bg-slate-900"
                            : "border-white/10 hover:border-white/20"
                    )}>
                        <Search className={cn(
                            "w-5 h-5 shrink-0 transition-colors duration-200",
                            isSearchFocused || query ? "text-amber-400" : "text-neutral-400"
                        )} />

                        <input
                            ref={searchInputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            placeholder="Film, dizi, kişi veya kullanıcı ara..."
                            className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-500 text-sm md:text-base font-semibold"
                        />

                        {/* OCR Camera Scanner */}
                        {isOcrLoading ? (
                            <div className="p-1.5" title="Yazı Okunuyor...">
                                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-all active:scale-95"
                                title="Kameradan / Afişten Tara"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImageCapture}
                        />

                        {/* Clear Query */}
                        {query && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    searchInputRef.current?.focus();
                                }}
                                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </form>

                {/* ═════════ SEARCH AUTOCOMPLETE & RECENT DROPDOWN ═════════ */}
                {isSearchFocused && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-white/5">
                        {/* Live Suggestions Result */}
                        {query.trim().length >= 2 ? (
                            <div className="p-2 max-h-[380px] overflow-y-auto">
                                <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                                    <span>Eşleşen Sonuçlar</span>
                                    {isSuggestLoading && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                                </div>

                                {suggestions.length > 0 ? (
                                    <div className="space-y-1">
                                        {suggestions.map((s, idx) => (
                                            <button
                                                key={`${s.id}-${idx}`}
                                                onClick={() => handleSelectSuggestion(s)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-left transition-colors group"
                                            >
                                                {s.image ? (
                                                    <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-800 shadow-md">
                                                        <Image
                                                            src={s.image}
                                                            alt={s.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                            sizes="40px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-xl border border-white/5">
                                                        {s.type === "movie" ? "🎬" : s.type === "tv" ? "📺" : "👤"}
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                                        {s.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                            s.type === "movie" ? "bg-amber-400/20 text-amber-400" :
                                                            s.type === "tv" ? "bg-blue-400/20 text-blue-400" :
                                                            s.type === "person" ? "bg-green-400/20 text-green-400" :
                                                            "bg-purple-400/20 text-purple-400"
                                                        )}>
                                                            {s.type === "movie" ? "Film" : s.type === "tv" ? "Dizi" : s.type === "person" ? "Kişi" : "Kullanıcı"}
                                                        </span>
                                                        {s.year && (
                                                            <span className="text-xs text-neutral-400 font-medium">
                                                                {s.year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : !isSuggestLoading ? (
                                    <div className="py-6 text-center text-xs text-neutral-400 font-medium">
                                        "{query}" için doğrudan eşleşme bulunamadı. Enter'a basarak filtrelerle arayın.
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            /* Empty search focus: Recent Searches & Trending */
                            <div className="p-3 space-y-4 max-h-[380px] overflow-y-auto">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                                <History className="w-3.5 h-3.5 text-neutral-400" />
                                                Son Aramalar
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearAllRecentSearches}
                                                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider hover:underline"
                                            >
                                                Tümünü Temizle
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {recentSearches.map((term, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => handleSelectQueryTag(term)}
                                                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white cursor-pointer transition-all active:scale-95"
                                                >
                                                    <span>{term}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => removeRecentSearch(term, e)}
                                                        className="opacity-40 hover:opacity-100 hover:text-red-400 p-0.5 rounded"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Popular / Trending Suggestions */}
                                <div className="space-y-2">
                                    <div className="px-1 text-[11px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                                        Popüler Aramalar
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {POPULAR_SEARCHES.map((term, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectQueryTag(term)}
                                                className="px-3 py-1.5 bg-amber-400/5 hover:bg-amber-400/15 border border-amber-400/20 hover:border-amber-400/40 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all active:scale-95"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═════════ 2. STREAMLINED HORIZONTAL FILTER BAR ═════════ */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {/* Type Segmented Pill */}
                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                        type="button"
                        onClick={() => setType("")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                            !type ? "bg-amber-400 text-slate-950 shadow-md" : "text-neutral-400 hover:text-white"
                        )}
                    >
                        Hepsi
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("movie")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1",
                            type === "movie" ? "bg-amber-400 text-slate-950 shadow-md" : "text-neutral-400 hover:text-white"
                        )}
                    >
                        <Film className="w-3 h-3" />
                        Film
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("tv")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1",
                            type === "tv" ? "bg-amber-400 text-slate-950 shadow-md" : "text-neutral-400 hover:text-white"
                        )}
                    >
                        <Tv className="w-3 h-3" />
                        Dizi
                    </button>
                </div>

                {/* Platform Chip */}
                <button
                    type="button"
                    onClick={() => setActiveModal("provider")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95",
                        selectedProviders.length > 0
                            ? "bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10"
                            : "bg-slate-900/80 border-white/10 text-neutral-300 hover:border-white/25 hover:text-white"
                    )}
                >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Platform</span>
                    {selectedProviders.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black">
                            {selectedProviders.length}
                        </span>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* Genre Chip */}
                <button
                    type="button"
                    onClick={() => setActiveModal("genre")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95",
                        selectedGenres.length > 0
                            ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-md shadow-purple-500/10"
                            : "bg-slate-900/80 border-white/10 text-neutral-300 hover:border-white/25 hover:text-white"
                    )}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Tür</span>
                    {selectedGenres.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-black">
                            {selectedGenres.length}
                        </span>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* Year & Rating Chip */}
                <button
                    type="button"
                    onClick={() => setActiveModal("year_rating")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95",
                        year || minRating
                            ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
                            : "bg-slate-900/80 border-white/10 text-neutral-300 hover:border-white/25 hover:text-white"
                    )}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                        {year ? year : minRating ? `${minRating}+ Puan` : "Yıl & Puan"}
                    </span>
                    {year && minRating && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                            {minRating}+
                        </span>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* Country Flag Chip */}
                <button
                    type="button"
                    onClick={() => setActiveModal("country")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95",
                        country !== "TR"
                            ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                            : "bg-slate-900/80 border-white/10 text-neutral-300 hover:border-white/25 hover:text-white"
                    )}
                >
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="text-xs">{selectedCountry.code}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* Clear All Active Filters */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Temizle ({activeFilterCount})</span>
                    </button>
                )}
            </div>

            {/* ═════════ 3. ACTIVE FILTERS REMOVABLE TAGS ═════════ */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {type && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/25 text-[11px] font-bold">
                            {type === "movie" ? "🎬 Film" : "📺 Dizi"}
                            <button type="button" onClick={() => setType("")} className="hover:text-white p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {selectedGenres.map(genreId => {
                        const g = genres.find(item => item.id.toString() === genreId);
                        return g ? (
                            <span key={genreId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[11px] font-bold">
                                🏷️ {g.name}
                                <button type="button" onClick={() => toggleGenre(genreId)} className="hover:text-white p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ) : null;
                    })}

                    {selectedProviders.map(providerId => {
                        const p = providers.find(item => item.id === providerId);
                        return p ? (
                            <span key={providerId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[11px] font-bold">
                                📺 {p.name}
                                <button type="button" onClick={() => toggleProvider(providerId)} className="hover:text-white p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ) : null;
                    })}

                    {year && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[11px] font-bold">
                            📅 {year}
                            <button type="button" onClick={() => setYear("")} className="hover:text-white p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {minRating && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 text-[11px] font-bold">
                            ⭐ {minRating}+ Puan
                            <button type="button" onClick={() => setMinRating("")} className="hover:text-white p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {country !== "TR" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[11px] font-bold">
                            {selectedCountry.flag} {selectedCountry.name}
                            <button type="button" onClick={() => setCountry("TR")} className="hover:text-white p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* ═════════ 4. FILTER MODALS ═════════ */}

            {/* Platform Selector Modal */}
            {activeModal === "provider" && (
                <Portal>
                    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                            onClick={() => setActiveModal(null)}
                        />
                        <div className="relative w-full max-w-lg bg-[#0b1120] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[99999] animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-white font-black text-lg sm:text-xl tracking-tight">Platform Seçimi</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{selectedCountry.name} için dijital yayın platformları</p>
                                </div>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search inside platform */}
                            <div className="p-3 border-b border-white/5 bg-slate-900/50">
                                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                    <Search className="w-4 h-4 text-neutral-400 mr-2" />
                                    <input
                                        type="text"
                                        value={providerSearch}
                                        onChange={(e) => setProviderSearch(e.target.value)}
                                        placeholder="Platform ara (Netflix, BluTV, Prime...)"
                                        className="bg-transparent outline-none text-xs sm:text-sm text-white placeholder:text-neutral-500 w-full"
                                    />
                                    {providerSearch && (
                                        <button onClick={() => setProviderSearch("")}>
                                            <X className="w-3.5 h-3.5 text-neutral-400" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-y-auto p-4 custom-scrollbar flex-1 space-y-2">
                                {loading ? (
                                    <div className="py-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                                        <span className="text-xs font-bold">Platformlar yükleniyor...</span>
                                    </div>
                                ) : filteredProviders.length === 0 ? (
                                    <div className="py-12 text-center text-neutral-500 text-xs font-medium">
                                        Aradığınız kriterde platform bulunamadı.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {filteredProviders.map(p => {
                                            const isSelected = selectedProviders.includes(p.id);
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => toggleProvider(p.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98]",
                                                        isSelected
                                                            ? "bg-sky-500/15 border-sky-400/80 shadow-md shadow-sky-500/10"
                                                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/15"
                                                    )}
                                                >
                                                    {p.logo ? (
                                                        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 relative">
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/original${p.logo}`}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-sm">
                                                            📺
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-bold text-white flex-1 truncate">
                                                        {p.name}
                                                    </span>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0",
                                                        isSelected ? "bg-sky-500 border-sky-400" : "border-white/20"
                                                    )}>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 font-black" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
                                {selectedProviders.length > 0 && (
                                    <button
                                        onClick={() => setSelectedProviders([])}
                                        className="text-xs font-bold text-neutral-400 hover:text-white px-3 py-2 rounded-xl"
                                    >
                                        Seçimi Sıfırla
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="ml-auto px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg"
                                >
                                    Uygula ({selectedProviders.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Genre Selector Modal */}
            {activeModal === "genre" && (
                <Portal>
                    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                            onClick={() => setActiveModal(null)}
                        />
                        <div className="relative w-full max-w-lg bg-[#0b1120] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[99999] animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-white font-black text-lg sm:text-xl tracking-tight">Tür Seçimi</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">İzlemek istediğin kategorileri belirle</p>
                                </div>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {genres.map(g => {
                                        const isSelected = selectedGenres.includes(g.id.toString());
                                        return (
                                            <button
                                                key={g.id}
                                                onClick={() => toggleGenre(g.id.toString())}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98]",
                                                    isSelected
                                                        ? "bg-purple-500/20 border-purple-400/80 shadow-md shadow-purple-500/10 text-purple-200"
                                                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/15 text-neutral-300"
                                                )}
                                            >
                                                <span className="text-xs font-bold truncate">
                                                    {g.name}
                                                </span>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ml-1.5",
                                                    isSelected ? "bg-purple-500 border-purple-400" : "border-white/20"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 text-white font-black" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
                                {selectedGenres.length > 0 && (
                                    <button
                                        onClick={() => setSelectedGenres([])}
                                        className="text-xs font-bold text-neutral-400 hover:text-white px-3 py-2 rounded-xl"
                                    >
                                        Seçimi Sıfırla
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="ml-auto px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg"
                                >
                                    Uygula ({selectedGenres.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Year & Rating Selector Modal */}
            {activeModal === "year_rating" && (
                <Portal>
                    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                            onClick={() => setActiveModal(null)}
                        />
                        <div className="relative w-full max-w-md bg-[#0b1120] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[99999] animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-white font-black text-lg sm:text-xl tracking-tight">Yıl ve Puan Filtresi</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">Yapım yılı ve minimum TMDB puanı</p>
                                </div>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 custom-scrollbar space-y-5">
                                {/* Minimum Rating */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-2.5">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                                        Minimum Puan
                                    </label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setMinRating("")}
                                            className={cn(
                                                "p-2.5 rounded-xl text-xs font-black transition-all border text-center",
                                                !minRating
                                                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                                                    : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                                            )}
                                        >
                                            Tümü
                                        </button>
                                        {[6, 7, 8, 9].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setMinRating(minRating === r.toString() ? "" : r.toString())}
                                                className={cn(
                                                    "p-2.5 rounded-xl text-xs font-black transition-all border text-center",
                                                    minRating === r.toString()
                                                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                                                        : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                                                )}
                                            >
                                                {r}+ ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Release Year */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1 mb-2.5">
                                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                        Yapım Yılı
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                        <button
                                            type="button"
                                            onClick={() => setYear("")}
                                            className={cn(
                                                "p-2 rounded-xl text-xs font-bold transition-all border text-center",
                                                !year
                                                    ? "bg-amber-400 text-slate-950 border-amber-400 font-black"
                                                    : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                                            )}
                                        >
                                            Tüm Yıllar
                                        </button>
                                        {YEARS.map((y) => (
                                            <button
                                                key={y}
                                                type="button"
                                                onClick={() => setYear(year === y ? "" : y)}
                                                className={cn(
                                                    "p-2 rounded-xl text-xs font-bold transition-all border text-center",
                                                    year === y
                                                        ? "bg-amber-400 text-slate-950 border-amber-400 font-black"
                                                        : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                                                )}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
                                {(year || minRating) && (
                                    <button
                                        onClick={() => { setYear(""); setMinRating(""); }}
                                        className="text-xs font-bold text-neutral-400 hover:text-white px-3 py-2 rounded-xl"
                                    >
                                        Temizle
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="ml-auto px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg"
                                >
                                    Uygula
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Country Selector Modal */}
            {activeModal === "country" && (
                <Portal>
                    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                            onClick={() => setActiveModal(null)}
                        />
                        <div className="relative w-full max-w-sm bg-[#0b1120] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[99999] animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="text-white font-black text-lg tracking-tight">Ülke & Bölge</h3>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-3 custom-scrollbar space-y-1">
                                {COUNTRIES.map(c => {
                                    const isSelected = country === c.code;
                                    return (
                                        <button
                                            key={c.code}
                                            onClick={() => {
                                                setCountry(c.code);
                                                setSelectedProviders([]);
                                                setActiveModal(null);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border text-left",
                                                isSelected
                                                    ? "bg-indigo-500/20 border-indigo-400/80 shadow-md text-white"
                                                    : "bg-white/[0.02] border-transparent hover:bg-white/[0.06] text-neutral-300"
                                            )}
                                        >
                                            <span className="text-2xl">{c.flag}</span>
                                            <span className="text-sm font-bold flex-1">{c.name}</span>
                                            {isSelected && <Check className="w-4 h-4 text-indigo-400 font-bold" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* OCR Crop Modal */}
            {cropImageSrc && (
                <Portal>
                    <DynamicCropModal
                        src={cropImageSrc}
                        crop={crop}
                        onCropChange={setCrop}
                        onCropComplete={setCompletedCrop}
                        imageRef={imageRef}
                        onImageLoad={onImageLoad}
                        onScan={handleCropAndScan}
                        onClose={() => setCropImageSrc(null)}
                        isLoading={isOcrLoading}
                    />
                </Portal>
            )}
        </div>
    );
}

// Lazily loaded crop modal
function DynamicCropModal({
    src,
    crop,
    onCropChange,
    onCropComplete,
    imageRef,
    onImageLoad,
    onScan,
    onClose,
    isLoading,
}: {
    src: string;
    crop: any;
    onCropChange: (c: any) => void;
    onCropComplete: (c: any) => void;
    imageRef: React.RefObject<HTMLImageElement | null>;
    onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    onScan: () => void;
    onClose: () => void;
    isLoading: boolean;
}) {
    const [ReactCropComponent, setReactCropComponent] = useState<any>(null);

    useEffect(() => {
        import("react-image-crop").then((mod) => {
            setReactCropComponent(() => mod.default);
        });
        import("react-image-crop/dist/ReactCrop.css" as any);
    }, []);

    if (!ReactCropComponent) {
        return (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl bg-[#0b1120] border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-white font-black">Taranacak Alanı Seçin</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                    </button>
                </div>
                <div className="p-4 overflow-auto max-h-[60vh]">
                    <ReactCropComponent
                        crop={crop}
                        onChange={onCropChange}
                        onComplete={onCropComplete}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imageRef}
                            src={src}
                            alt="OCR kaynak"
                            onLoad={onImageLoad}
                            className="max-w-full"
                        />
                    </ReactCropComponent>
                </div>
                <div className="p-4 border-t border-white/10 flex gap-3 justify-end bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-xs font-bold transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onScan}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all hover:bg-amber-300 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                        Tara & Ara
                    </button>
                </div>
            </div>
        </div>
    );
}
