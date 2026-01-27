"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, Star, Play, Filter, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDERS = [
    { id: "8", name: "Netflix", logo: "https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
    { id: "337", name: "Disney+", logo: "https://image.tmdb.org/t/p/original/97yvRBw1GzX7fXprcF80er19ot.jpg" },
    { id: "119", name: "Prime Video", logo: "https://image.tmdb.org/t/p/original/pvske1MyAoymrs5bguRfVqYiM9a.jpg" },
    { id: "2", name: "Apple TV", logo: "https://image.tmdb.org/t/p/original/SPnB1qiCkYfirS2it3hZORwGVn.jpg" },
    { id: "11", name: "MUBI", logo: "https://image.tmdb.org/t/p/original/x570VpH2C9EKDf1riP83rYc5dnL.jpg" },
    { id: "1826", name: "TOD", logo: "https://image.tmdb.org/t/p/original/gaDNJ1xISHBBq9LQXwwe8PPSRHD.jpg" },
    { id: "2235", name: "tabii", logo: "https://image.tmdb.org/t/p/original/uWVpt3iJ2pLKtFZ69rAKP0EDVVx.jpg" },
];



const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

const MOVIE_GENRES = [
    { id: 28, name: "Aksiyon" },
    { id: 12, name: "Macera" },
    { id: 16, name: "Animasyon" },
    { id: 35, name: "Komedi" },
    { id: 80, name: "Suç" },
    { id: 99, name: "Belgesel" },
    { id: 18, name: "Dram" },
    { id: 10751, name: "Aile" },
    { id: 14, name: "Fantastik" },
    { id: 36, name: "Tarih" },
    { id: 27, name: "Korku" },
    { id: 10402, name: "Müzik" },
    { id: 9648, name: "Gizem" },
    { id: 10749, name: "Romantik" },
    { id: 878, name: "Bilim Kurgu" },
    { id: 10770, name: "TV Film" },
    { id: 53, name: "Gerilim" },
    { id: 10752, name: "Savaş" },
    { id: 37, name: "Vahşi Batı" },
];

const TV_GENRES = [
    { id: 10759, name: "Aksiyon & Macera" },
    { id: 16, name: "Animasyon" },
    { id: 35, name: "Komedi" },
    { id: 80, name: "Suç" },
    { id: 99, name: "Belgesel" },
    { id: 18, name: "Dram" },
    { id: 10751, name: "Aile" },
    { id: 10762, name: "Çocuk" },
    { id: 9648, name: "Gizem" },
    { id: 10763, name: "Haber" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Bilim Kurgu & Fantastik" },
    { id: 10766, name: "Pembe Dizi" },
    { id: 10767, name: "Talk Show" },
    { id: 10768, name: "Savaş & Politika" },
    { id: 37, name: "Vahşi Batı" },
];

export function MediaFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [type, setType] = useState(searchParams.get("type") || "movie");
    const [year, setYear] = useState(searchParams.get("year") || "");
    const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
    const [provider, setProvider] = useState(searchParams.get("provider") || "");
    const [genre, setGenre] = useState(searchParams.get("genre") || "");
    // ülke filtresi kaldırıldı
    const [isOpen, setIsOpen] = useState(false);
    const [isInitialRender, setIsInitialRender] = useState(true);

    const genres = type === "movie" ? MOVIE_GENRES : TV_GENRES;

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

        if (provider) params.set("provider", provider);
        else params.delete("provider");

        if (genre) params.set("genre", genre);
        else params.delete("genre");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [type, year, minRating, provider, genre, pathname, router, searchParams]);

    const hasActiveFilters = year || minRating || provider || genre || searchParams.get("type");

    const handleClear = () => {
        setType("movie");
        setYear("");
        setMinRating("");
        setProvider("");
        setGenre("");
        router.push(pathname);
    };

    return (
        <div className="px-6 md:px-10 -mt-8 relative z-20">
            <div className="max-w-7xl mx-auto">
                <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Ne İzlemek İstersin?</h3>
                                <p className="text-xs text-neutral-400">Aradığın içeriği hemen bul</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden p-2 rounded-xl bg-white/5"
                            >
                                <Filter className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className={cn(
                            "w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4",
                            isOpen ? "flex" : "hidden md:grid"
                        )}>

                            <div className="flex bg-white/5 p-1 rounded-xl">
                                <button
                                    onClick={() => setType("movie")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                                        type === "movie" ? "bg-white text-black shadow-lg" : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    Film
                                </button>
                                <button
                                    onClick={() => setType("tv")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                                        type === "tv" ? "bg-white text-black shadow-lg" : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    Dizi
                                </button>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Play className="w-4 h-4 text-neutral-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <select
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="" className="bg-neutral-900">Platform Seç</option>
                                    {PROVIDERS.map(p => <option key={p.id} value={p.id} className="bg-neutral-900">{p.name}</option>)}
                                </select>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Tag className="w-4 h-4 text-neutral-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <select
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="" className="bg-neutral-900">Tür Seç</option>
                                    {genres.map(g => <option key={g.id} value={g.id.toString()} className="bg-neutral-900">{g.name}</option>)}
                                </select>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Calendar className="w-4 h-4 text-neutral-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="" className="bg-neutral-900">Yıl Seç</option>
                                    {YEARS.map(y => <option key={y} value={y} className="bg-neutral-900">{y}</option>)}
                                </select>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Star className="w-4 h-4 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                                </div>
                                <select
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                >
                                    <option value="" className="bg-neutral-900">Puan (Min)</option>
                                    {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(r => <option key={r} value={r} className="bg-neutral-900">{r}+ Puan</option>)}
                                </select>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={handleClear}
                                className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
