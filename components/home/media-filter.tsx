"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Sparkles, Check, Search, Film, Tv, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { MediaCard } from "@/components/media/media-card";

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

export function MediaFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

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
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [showGenreDropdown, setShowGenreDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showAllProviders, setShowAllProviders] = useState(false);

    // Search suggestions
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Dynamic data from TMDB
    const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
    const [providers, setProviders] = useState<{ id: string; name: string; logo: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch search suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query || query.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setLoadingSuggestions(true);
            try {
                const response = await fetch(`/api/search-suggest?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setSuggestions(data.results?.slice(0, 5) || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchInputRef.current &&
                !searchInputRef.current.contains(e.target as Node) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auto-focus search input on page load (except for home page)
    useEffect(() => {
        if (searchInputRef.current && pathname !== "/") {
            searchInputRef.current.focus();
        }
    }, [pathname]);

    // Fetch genres and providers from TMDB
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                setLoading(true);

                // If no type selected, use movie for fetching filters (will show combined results)
                const genreType = type || "movie";
                const genreResponse = await fetch(`/api/tmdb/genres?type=${genreType}`);
                const genreData = await genreResponse.json();
                setGenres(genreData.genres || []);

                const providerResponse = await fetch(`/api/tmdb/providers?type=${genreType}&country=${country}`);
                const providerData = await providerResponse.json();
                setProviders(providerData.providers || []);
                setShowAllProviders(false); // Reset show all state when filters change

                setLoading(false);
            } catch (error) {
                console.error("Error fetching filter data:", error);
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

        const params = new URLSearchParams(searchParams.toString());

        if (type) params.set("type", type);
        else params.delete("type");

        if (year) params.set("year", year);
        else params.delete("year");

        if (minRating) params.set("rating", minRating);
        else params.delete("rating");

        // Don't update query here - only on form submit
        if (params.has("q") && !query) {
            params.delete("q");
        }

        if (country && country !== "TR") params.set("country", country);
        else params.delete("country");

        if (selectedProviders.length > 0) params.set("provider", selectedProviders.join(","));
        else params.delete("provider");

        if (selectedGenres.length > 0) params.set("genre", selectedGenres.join(","));
        else params.delete("genre");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [type, year, minRating, country, selectedProviders, selectedGenres, pathname, router, searchParams, isInitialRender]);

    const hasActiveFilters = year || minRating || query || (country && country !== "TR") || selectedProviders.length > 0 || selectedGenres.length > 0 || searchParams.get("type");

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Build URL with all current filters
        const params = new URLSearchParams();
        params.set("q", query);
        if (type) params.set("type", type);
        if (year) params.set("year", year);
        if (minRating) params.set("rating", minRating);
        if (country && country !== "TR") params.set("country", country);
        if (selectedProviders.length > 0) params.set("provider", selectedProviders.join(","));
        if (selectedGenres.length > 0) params.set("genre", selectedGenres.join(","));

        // Navigate to search page
        router.push(`/search?${params.toString()}`);
        setShowSuggestions(false);
    };

    const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

    return (
        <div className="relative z-20">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/20 rounded-2xl border border-primary/30">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic">
                                    Keşfet & Ara
                                </h3>
                                <p className="text-xs text-neutral-400 font-medium">İstediğin içeriği hemen bul</p>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/10 text-xs font-bold"
                            >
                                <X className="w-3.5 h-3.5" />
                                Temizle
                            </button>
                        )}
                    </div>

                    {/* Filters - All Equal and Minimal */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {/* Type Toggle - 3 States: Film, Dizi, or All */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setType(type === "movie" ? "" : "movie")}
                                className={cn(
                                    "flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all uppercase",
                                    type === "movie"
                                        ? "bg-primary text-white"
                                        : "text-neutral-400 hover:text-white"
                                )}
                            >
                                Film
                            </button>
                            <button
                                onClick={() => setType(type === "tv" ? "" : "tv")}
                                className={cn(
                                    "flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all uppercase",
                                    type === "tv"
                                        ? "bg-primary text-white"
                                        : "text-neutral-400 hover:text-white"
                                )}
                            >
                                Dizi
                            </button>
                        </div>

                        {/* Country - Only Flag */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                            >
                                <span className="text-xl">{selectedCountry.flag}</span>
                            </button>

                            {showCountryDropdown && (
                                <Portal>
                                    <div
                                        className="fixed inset-0 z-[99998]"
                                        onClick={() => setShowCountryDropdown(false)}
                                    />
                                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#1A202C] border border-white/20 rounded-xl shadow-2xl z-[99999] max-h-[80vh] overflow-y-auto p-2">
                                        <div className="flex items-center justify-between p-3 border-b border-white/10 mb-2">
                                            <span className="font-bold text-white">Ülke Seç</span>
                                            <button onClick={() => setShowCountryDropdown(false)} className="p-1 hover:bg-white/10 rounded-full">
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                        {COUNTRIES.map(c => (
                                            <button
                                                key={c.code}
                                                onClick={() => {
                                                    setCountry(c.code);
                                                    setSelectedProviders([]);
                                                    setShowCountryDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all rounded-lg"
                                            >
                                                <span className="text-2xl">{c.flag}</span>
                                                <span className="text-sm font-medium text-white">{c.name}</span>
                                                {country === c.code && (
                                                    <Check className="w-4 h-4 text-primary ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </Portal>
                            )}
                        </div>

                        {/* Platform */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                                disabled={loading}
                                className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 text-xs font-bold text-white"
                            >
                                <span className="truncate px-2">
                                    {selectedProviders.length > 0 ? `${selectedProviders.length} Platform` : "Platform"}
                                </span>
                            </button>

                            {showProviderDropdown && (
                                <Portal>
                                    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                                        <div
                                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                            onClick={() => setShowProviderDropdown(false)}
                                        />
                                        <div className="relative w-full max-w-lg bg-[#1A202C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200 z-[99999]">
                                            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                                                <h3 className="text-white font-bold text-lg">Platformlar</h3>
                                                <button
                                                    onClick={() => setShowProviderDropdown(false)}
                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                                >
                                                    <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                                                </button>
                                            </div>

                                            <div className="overflow-y-auto p-4 custom-scrollbar">
                                                {providers.length === 0 ? (
                                                    <div className="text-center py-8 text-neutral-500">
                                                        {loading ? "Yükleniyor..." : "Bu ülkede platform bulunamadı"}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {(showAllProviders ? providers : providers.slice(0, 8)).map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => toggleProvider(p.id)}
                                                                    className={cn(
                                                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left",
                                                                        selectedProviders.includes(p.id)
                                                                            ? "bg-primary/10 border-primary/30"
                                                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                                        selectedProviders.includes(p.id)
                                                                            ? "bg-primary border-primary"
                                                                            : "border-white/20"
                                                                    )}>
                                                                        {selectedProviders.includes(p.id) && (
                                                                            <Check className="w-3 h-3 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-sm font-medium",
                                                                        selectedProviders.includes(p.id) ? "text-white" : "text-neutral-300"
                                                                    )}>
                                                                        {p.name}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {!showAllProviders && providers.length > 8 && (
                                                            <button
                                                                onClick={() => setShowAllProviders(true)}
                                                                className="w-full mt-4 py-3 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors border border-primary/20"
                                                            >
                                                                Diğerlerini Göster ({providers.length - 8})
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div className="p-4 border-t border-white/5 bg-white/5">
                                                <button
                                                    onClick={() => setShowProviderDropdown(false)}
                                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
                                                >
                                                    Tamam ({selectedProviders.length})
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Portal>
                            )}
                        </div>

                        {/* Genre */}
                        <div className="relative">
                            <button
                                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                                disabled={loading}
                                className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 text-xs font-bold text-white"
                            >
                                <span className="truncate px-2">
                                    {selectedGenres.length > 0 ? `${selectedGenres.length} Tür` : "Tür"}
                                </span>
                            </button>

                            {showGenreDropdown && (
                                <Portal>
                                    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
                                        <div
                                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                            onClick={() => setShowGenreDropdown(false)}
                                        />
                                        <div className="relative w-full max-w-lg bg-[#1A202C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200 z-[99999]">
                                            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                                                <h3 className="text-white font-bold text-lg">Türler</h3>
                                                <button
                                                    onClick={() => setShowGenreDropdown(false)}
                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                                >
                                                    <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                                                </button>
                                            </div>

                                            <div className="overflow-y-auto p-4 custom-scrollbar">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {genres.map(g => (
                                                        <button
                                                            key={g.id}
                                                            onClick={() => toggleGenre(g.id.toString())}
                                                            className={cn(
                                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left",
                                                                selectedGenres.includes(g.id.toString())
                                                                    ? "bg-primary/10 border-primary/30"
                                                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                                selectedGenres.includes(g.id.toString())
                                                                    ? "bg-primary border-primary"
                                                                    : "border-white/20"
                                                            )}>
                                                                {selectedGenres.includes(g.id.toString()) && (
                                                                    <Check className="w-3 h-3 text-white" />
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm font-medium",
                                                                selectedGenres.includes(g.id.toString()) ? "text-white" : "text-neutral-300"
                                                            )}>
                                                                {g.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-white/5 bg-white/5">
                                                <button
                                                    onClick={() => setShowGenreDropdown(false)}
                                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
                                                >
                                                    Tamam ({selectedGenres.length})
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Portal>
                            )}
                        </div>

                        {/* Year */}
                        <div className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full h-full bg-white/5 border border-white/10 rounded-xl py-2 px-2 text-xs font-bold text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer hover:bg-white/10 text-center"
                            >
                                <option value="" className="bg-neutral-900">Yıl</option>
                                {YEARS.map(y => (
                                    <option key={y} value={y} className="bg-neutral-900">{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rating */}
                        <div className="relative">
                            <select
                                value={minRating}
                                onChange={(e) => setMinRating(e.target.value)}
                                className="w-full h-full bg-white/5 border border-white/10 rounded-xl py-2 px-2 text-xs font-bold text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer hover:bg-white/10 text-center"
                            >
                                <option value="" className="bg-neutral-900">Puan</option>
                                {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => (
                                    <option key={r} value={r} className="bg-neutral-900">{r}+</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <form onSubmit={handleSearch}>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                                <Search className="w-5 h-5 text-neutral-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => {
                                        if (query.length >= 2 && suggestions.length > 0) setShowSuggestions(true);
                                    }}
                                    placeholder="Film, dizi veya kişi ara..."
                                    className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-400 text-sm md:text-base font-medium"
                                />
                                {loadingSuggestions ? (
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery("");
                                            setSuggestions([]);
                                        }}
                                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-neutral-400" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && (query.length >= 2) && (
                            <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 bg-[#1A202C]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                                {suggestions.length > 0 ? (
                                    <div className="py-4">
                                        {/* Separating People and Content */}
                                        {(() => {
                                            const people = suggestions.filter(item => item.media_type === "person");
                                            const content = suggestions.filter(item => item.media_type !== "person");

                                            return (
                                                <>
                                                    {people.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="px-5 py-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                                <span className="w-1 h-3 bg-primary rounded-full" />
                                                                Sanatçılar
                                                            </div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 px-4">
                                                                {people.map((item) => (
                                                                    <Link
                                                                        key={item.id}
                                                                        href={`/person/${item.id}`}
                                                                        className="flex flex-col items-center gap-3 p-3 rounded-3xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
                                                                        onClick={() => setShowSuggestions(false)}
                                                                    >
                                                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/5 group-hover:border-primary/50 transition-all shadow-xl ring-4 ring-transparent group-hover:ring-primary/10">
                                                                            {item.profile_path ? (
                                                                                <Image
                                                                                    src={`https://image.tmdb.org/t/p/w185${item.profile_path}`}
                                                                                    alt={item.name}
                                                                                    fill
                                                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                                                                    👤
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[11px] font-black text-white text-center line-clamp-2 leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">
                                                                            {item.name}
                                                                        </span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {content.length > 0 && (
                                                        <div>
                                                            <div className="px-5 py-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                <span className="w-1 h-3 bg-neutral-700 rounded-full" />
                                                                İçerikler
                                                            </div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-4 pb-2">
                                                                {content.map((item) => (
                                                                    <div key={item.id} onClick={() => setShowSuggestions(false)} className="scale-90 origin-top">
                                                                        <MediaCard
                                                                            id={item.id}
                                                                            title={item.title || item.name}
                                                                            originalTitle={item.original_title || item.original_name}
                                                                            posterPath={item.poster_path}
                                                                            voteAverage={item.vote_average || 0}
                                                                            releaseDate={item.release_date || item.first_air_date}
                                                                            type={item.media_type as "movie" | "tv"}
                                                                            fullWidth={true}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <button
                                            onClick={(e) => handleSearch(e)}
                                            className="w-full text-center py-4 mt-2 text-xs font-black text-primary hover:bg-primary/5 transition-all border-t border-white/5 uppercase tracking-[0.2em]"
                                        >
                                            Tüm Sonuçları Gör
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-neutral-500 text-sm font-medium">
                                        <div className="mb-2 text-2xl">🔍</div>
                                        Sonuç bulunamadı
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="group flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-all"
                                >
                                    <Search className="w-3 h-3" />
                                    "{query}"
                                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                </button>
                            )}
                            {country && country !== "TR" && (
                                <button
                                    onClick={() => setCountry("TR")}
                                    className="group flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                                >
                                    <span>{selectedCountry.flag}</span>
                                    {selectedCountry.name}
                                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                </button>
                            )}
                            {selectedGenres.map(genreId => {
                                const genre = genres.find(g => g.id.toString() === genreId);
                                return genre ? (
                                    <button
                                        key={genreId}
                                        onClick={() => toggleGenre(genreId)}
                                        className="group flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/20 transition-all"
                                    >
                                        {genre.name}
                                        <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                    </button>
                                ) : null;
                            })}
                            {selectedProviders.map(providerId => {
                                const provider = providers.find(p => p.id === providerId);
                                return provider ? (
                                    <button
                                        key={providerId}
                                        onClick={() => toggleProvider(providerId)}
                                        className="group flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                    >
                                        {provider.name}
                                        <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                    </button>
                                ) : null;
                            })}
                            {year && (
                                <button
                                    onClick={() => setYear("")}
                                    className="group flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                                >
                                    {year}
                                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                </button>
                            )}
                            {minRating && (
                                <button
                                    onClick={() => setMinRating("")}
                                    className="group flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition-all"
                                >
                                    {minRating}+ Puan
                                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
