"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Check, 
    ChevronRight, 
    ChevronLeft, 
    User, 
    Film, 
    Tv, 
    Search,
    Sparkles,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/lib/onboarding-actions";

interface Genre {
    id: number;
    name: string;
}

interface Platform {
    id: string;
    name: string;
    icon: string;
}

interface OnboardingFormProps {
    genres: Genre[];
    platforms: Platform[];
    defaultUsername?: string;
}

export function OnboardingForm({ genres, platforms, defaultUsername = "" }: OnboardingFormProps) {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState(defaultUsername);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedFavorites, setSelectedFavorites] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [genreSearch, setGenreSearch] = useState("");
    const [platformSearch, setPlatformSearch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSteps = 4;

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const toggleGenre = (id: number) => {
        setSelectedGenres(prev => 
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleFavorite = (item: any) => {
        setSelectedFavorites(prev => {
            const exists = prev.find(f => f.id === item.id);
            if (exists) return prev.filter(f => f.id !== item.id);
            if (prev.length >= 5) return prev; // Limit to 5 favorites
            return [...prev, item];
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                        Adım {step} / {totalSteps}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                        {Math.round((step / totalSteps) * 100)}% Tamamlandı
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                        initial={{ width: "25%" }}
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="min-h-[400px]"
                >
                    {/* STEP 1: USERNAME */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-1">
                                    Kullanıcı Adı
                                </h2>
                                <p className="text-xs text-neutral-400 font-medium">
                                    Seni nasıl çağırmamızı istersin? (İsteğe bağlı)
                                </p>
                            </div>

                            <div className="max-w-md mx-auto md:mx-0 space-y-3">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input 
                                        type="text"
                                        placeholder={defaultUsername || "Kullanıcı Adı"}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-lg font-bold text-white focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all placeholder:text-neutral-500/50"
                                    />
                                </div>
                                <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest px-4">
                                    Boş bırakırsanız e-posta adresinizin ilk kısmı kullanılacaktır.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: GENRES */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-1">
                                        Neler İzlemeyi Seversin?
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        Sana özel öneriler için en az 3 tür seçmeni öneririz.
                                    </p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="Tür ara..."
                                        value={genreSearch}
                                        onChange={(e) => setGenreSearch(e.target.value)}
                                        className="w-full md:w-48 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-400/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 md:gap-2">
                                {genres
                                    .filter(g => g.name.toLowerCase().includes(genreSearch.toLowerCase()))
                                    .map((genre) => {
                                    const isActive = selectedGenres.includes(genre.id);
                                    return (
                                        <button
                                            key={genre.id}
                                            onClick={() => toggleGenre(genre.id)}
                                            className={cn(
                                                "relative px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                isActive 
                                                    ? "bg-amber-400 border-amber-400 text-slate-950 shadow-lg shadow-amber-400/10 scale-105" 
                                                    : "bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {genre.name}
                                            {isActive && (
                                                <div className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-0.5 border border-amber-400">
                                                    <Check className="w-2 h-2 text-amber-400" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PLATFORMS */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-1">
                                        Hangi Platformları Kullanıyorsun?
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        Sadece izleyebileceğin platformları öne çıkaralım.
                                    </p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="Platform ara..."
                                        value={platformSearch}
                                        onChange={(e) => setPlatformSearch(e.target.value)}
                                        className="w-full md:w-48 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-400/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {platforms
                                    .filter(p => p.name.toLowerCase().includes(platformSearch.toLowerCase()))
                                    .map((platform) => {
                                    const isActive = selectedPlatforms.includes(platform.id);
                                    return (
                                        <button
                                            key={platform.id}
                                            onClick={() => togglePlatform(platform.id)}
                                            title={platform.name}
                                            className="relative group transition-transform duration-300 hover:scale-110 active:scale-95"
                                        >
                                            <div className={cn(
                                                "w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-xl transition-all duration-300 border-2",
                                                isActive
                                                    ? "border-amber-400 opacity-100 ring-4 ring-amber-400/20 scale-105"
                                                    : "border-transparent opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                                            )}>
                                                <img src={platform.icon} alt={platform.name} className="w-full h-full object-cover" />
                                            </div>
                                            {isActive && (
                                                <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1 border-2 border-[#020617] shadow-lg">
                                                    <Check className="w-3 h-3 text-slate-950 font-black" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: FAVORITES */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-1">
                                    Favori Filmlerin Neler?
                                </h2>
                                <p className="text-xs text-neutral-400 font-medium">
                                    Beğendiğin yapımları seç, zevkini daha iyi anlayalım. (Max 5)
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Search Bar */}
                                <div className="relative group max-w-xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input 
                                        type="text"
                                        placeholder="Film veya dizi ara..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base font-bold text-white focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all placeholder:text-neutral-700"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Results Grid */}
                                {searchResults.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                                        {searchResults.map((item) => {
                                            const isSelected = selectedFavorites.find(f => f.id === item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleFavorite(item)}
                                                    className={cn(
                                                        "relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300",
                                                        isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-95" : "hover:scale-105"
                                                    )}
                                                >
                                                    <img 
                                                        src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : "/placeholder.jpg"} 
                                                        alt={item.title || item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-amber-400/20 backdrop-blur-[1px] flex items-center justify-center">
                                                            <CheckCircle2 className="w-8 h-8 text-amber-400 fill-slate-950" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Selected Favorites */}
                                <div className="space-y-2">
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
                                        Seçilen Favoriler ({selectedFavorites.length} / 5)
                                    </h3>
                                    <div className="flex flex-wrap gap-2 min-h-[80px] p-4 border border-white/5 rounded-2xl bg-white/2">
                                        {selectedFavorites.length === 0 ? (
                                            <div className="flex items-center justify-center w-full text-neutral-700 gap-2">
                                                <Sparkles className="w-5 h-5 opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Henüz seçim yok</p>
                                            </div>
                                        ) : (
                                            selectedFavorites.map((item) => (
                                                <div key={item.id} className="relative group animate-in zoom-in duration-300">
                                                    <div className="w-12 h-18 rounded-md overflow-hidden border border-amber-400/30">
                                                        <img 
                                                            src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : "/placeholder.jpg"} 
                                                            className="w-full h-full object-cover"
                                                            alt={item.title || item.name}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleFavorite(item)}
                                                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Check className="w-2.5 h-2.5 rotate-45" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-6">
                <button
                    onClick={handleBack}
                    className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                        step === 1 ? "opacity-0 pointer-events-none" : "text-neutral-500 hover:text-white hover:bg-white/5"
                    )}
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Geri
                </button>

                {step < totalSteps ? (
                    <button
                        onClick={handleNext}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-400/10 hover:bg-amber-300 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                        )}
                    >
                        Devam Et
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <form action={completeOnboarding}>
                        {/* Hidden Inputs for Form Data */}
                        <input type="hidden" name="username" value={username} />
                        {selectedGenres.map(id => <input key={`g-${id}`} type="hidden" name="genres" value={id} />)}
                        {selectedPlatforms.map(id => <input key={`p-${id}`} type="hidden" name="platforms" value={id} />)}
                        {selectedFavorites.map(item => <input key={`f-${item.id}`} type="hidden" name="favorites" value={item.id} />)}

                        <button
                            type="submit"
                            className="flex items-center gap-2 px-8 py-3 bg-amber-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-400/10 hover:bg-amber-300 transition-all active:scale-95"
                        >
                            Tamamla ve Başla
                            <Sparkles className="w-3.5 h-3.5" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
