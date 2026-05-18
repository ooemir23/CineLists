"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Sparkles, Check, Search, Film, Tv, Star, Camera, Loader2, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { MediaCard } from "@/components/media/media-card";

// react-image-crop and tesseract.js are loaded dynamically on demand
// to avoid including ~520KB+ in the initial bundle.
// They are only needed when the user activates the OCR camera feature.

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isOcrLoading, setIsOcrLoading] = useState(false);
    
    // Crop states — types kept loose since react-image-crop is loaded dynamically
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
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [showGenreDropdown, setShowGenreDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showAllProviders, setShowAllProviders] = useState(false);
    const [lastFilterTime, setLastFilterTime] = useState(0);


    // Dynamic data from TMDB
    const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
    const [providers, setProviders] = useState<{ id: string; name: string; logo: string }[]>([]);
    const [loading, setLoading] = useState(true);

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
            setCropImageSrc(null); // Hide modal while scanning

            // Dynamically import tesseract.js (~500KB) only when OCR is actually triggered
            const { default: Tesseract } = await import("tesseract.js");
            const result = await Tesseract.recognize(croppedImageUrl, 'tur+eng', {
                logger: m => console.log(m)
            });

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

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (type) params.set("type", type);
            else params.delete("type");

            if (year) params.set("year", year);
            else params.delete("year");

            if (minRating) params.set("rating", minRating);
            else params.delete("rating");

            // Update query live
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
                setLastFilterTime(Date.now());
            }
        }, 500); // 500ms debounce for live search

        return () => clearTimeout(timeoutId);
    }, [type, year, minRating, country, selectedProviders, selectedGenres, query, pathname, router, searchParams, isInitialRender]);


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
    };

    const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

    return (
        <div className="relative">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 shadow-2xl">
                <div className="flex flex-col gap-2">

                    {/* Filters - Ultra Compact */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {/* Type Toggle - 3 States: Film, Dizi, or All */}
                        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                            <button
                                onClick={() => setType(type === "movie" ? "" : "movie")}
                                className={cn(
                                    "flex-1 py-1 px-1.5 rounded-md text-[10px] font-black transition-all uppercase",
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
                                    "flex-1 py-1 px-1.5 rounded-md text-[10px] font-black transition-all uppercase",
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
                                className="w-full h-full min-h-[28px] flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                            >
                                <span className="text-base">{selectedCountry.flag}</span>
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
                                className="w-full h-full min-h-[28px] flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 text-[10px] font-black text-neutral-500 hover:text-white uppercase"
                            >
                                <span className="truncate px-1 flex items-center gap-1">
                                    {selectedProviders.length > 0 ? (
                                        <>
                                            <span className="text-primary">{selectedProviders.length}</span>
                                            <span>Platform</span>
                                        </>
                                    ) : (
                                        "Platform"
                                    )}
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
                                className="w-full h-full min-h-[28px] flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 text-[10px] font-black text-neutral-500 hover:text-white uppercase"
                            >
                                <span className="truncate px-1 flex items-center gap-1">
                                    {selectedGenres.length > 0 ? (
                                        <>
                                            <span className="text-primary">{selectedGenres.length}</span>
                                            <span>Tür</span>
                                        </>
                                    ) : (
                                        "Tür"
                                    )}
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
                                className="w-full h-full min-h-[28px] bg-white/5 border border-white/10 rounded-lg py-1 px-1 text-[10px] font-black text-neutral-500 hover:text-white appearance-none focus:outline-none transition-all cursor-pointer hover:bg-white/10 text-center uppercase"
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
                                className="w-full h-full min-h-[28px] bg-white/5 border border-white/10 rounded-lg py-1 px-1 text-[10px] font-black text-white appearance-none focus:outline-none transition-all cursor-pointer hover:bg-white/10 text-center"
                            >
                                <option value="" className="bg-neutral-900">Puan</option>
                                {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => (
                                    <option key={r} value={r} className="bg-neutral-900">{r}+</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Search Bar - Main Focus */}
                    <div className="relative">
                        <form onSubmit={handleSearch}>
                            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-inner">
                                <Search className="w-5 h-5 text-neutral-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Film, dizi veya kişi ara..."
                                    className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-500 text-sm md:text-base font-bold"
                                />
                                {isOcrLoading ? (
                                    <div className="p-1.5 rounded-full relative" title="Yazı Okunuyor...">
                                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors group/ocr"
                                        title="Kameradan Yazı Tara"
                                    >
                                        <Camera className="w-5 h-5 text-neutral-400 group-hover/ocr:text-amber-400 transition-colors" />
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
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery("");
                                        }}
                                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-neutral-400" />
                                    </button>
                                )}
                            </div>
                        </form>

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

                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all border border-red-500/20 text-xs font-black uppercase ml-auto"
                            >
                                <X className="w-3.5 h-3.5" />
                                Temizle
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* OCR Crop Modal — react-image-crop loaded dynamically only when needed */}
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

// Lazily loaded crop modal — keeps react-image-crop out of the initial bundle
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
        // Dynamically import react-image-crop (~20KB) only when the crop modal opens
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
            <div className="w-full max-w-2xl bg-[#1A202C] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-white font-bold">Taranacak Alanı Seçin</h3>
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
                <div className="p-4 border-t border-white/10 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-sm font-bold transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onScan}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-400 text-black font-black text-sm transition-all hover:bg-amber-300 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                        Tara
                    </button>
                </div>
            </div>
        </div>
    );
}
