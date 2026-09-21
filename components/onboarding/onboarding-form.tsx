"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Sparkles, User, Tv, Film, ArrowRight, Loader2, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeOnboarding, skipOnboarding } from "@/lib/onboarding-actions";

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
    const [username, setUsername] = useState(defaultUsername);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const toggleGenre = (id: number) => {
        setSelectedGenres((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const handleSkip = () => {
        startTransition(async () => {
            await skipOnboarding();
        });
    };

    return (
        <div className="w-full max-w-3xl mx-auto rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-10 shadow-2xl backdrop-blur-xl">
            {/* Header with quick skip button */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-400">
                        <Sparkles size={14} />
                        Hızlı Kurulum (10 Saniye)
                    </div>
                    <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
                        Hoş Geldin! 🎉
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Sana özel film ve dizi önerileri sunabilmemiz için birkaç saniyede tercihlerini seç.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isPending}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    title="Kurulumu hemen tamamlayıp ana sayfaya geçin"
                >
                    <FastForward size={14} className="text-amber-400" />
                    <span>Şimdilik Atla</span>
                </button>
            </div>

            <form action={completeOnboarding} className="mt-8 space-y-8">
                {/* 1. Kullanıcı Adı */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                        <User size={14} className="text-amber-400" />
                        Kullanıcı Adın
                        <span className="text-[10px] font-normal text-slate-500 lowercase">(isteğe bağlı)</span>
                    </label>
                    <div className="relative max-w-md">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                            @
                        </span>
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="kullanici_adi"
                            className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-4 text-sm font-medium text-white transition-all placeholder:text-slate-600 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                        />
                    </div>
                </div>

                {/* 2. Platformlar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                            <Tv size={14} className="text-amber-400" />
                            Kullandığın Platformlar
                            <span className="text-[10px] font-normal text-slate-500 lowercase">
                                ({selectedPlatforms.length} seçildi)
                            </span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                            İzleyebileceğin içerikleri öne çıkarırız
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                        {platforms.slice(0, 18).map((platform) => {
                            const isSelected = selectedPlatforms.includes(platform.id);
                            return (
                                <button
                                    key={platform.id}
                                    type="button"
                                    onClick={() => togglePlatform(platform.id)}
                                    className={cn(
                                        "group relative flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition-all text-center focus:outline-none",
                                        isSelected
                                            ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10 scale-[1.02]"
                                            : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-slate-950/70 opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10">
                                        <img
                                            src={platform.icon}
                                            alt={platform.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <span className="truncate w-full text-[11px] font-bold text-slate-300 group-hover:text-white">
                                        {platform.name}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950">
                                            <Check size={10} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Sevilen Türler */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                            <Film size={14} className="text-amber-400" />
                            Sevdiğin Türler
                            <span className="text-[10px] font-normal text-slate-500 lowercase">
                                ({selectedGenres.length} seçildi)
                            </span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                            Zevkine uygun öneriler sunulur
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {genres.map((genre) => {
                            const isSelected = selectedGenres.includes(genre.id);
                            return (
                                <button
                                    key={genre.id}
                                    type="button"
                                    onClick={() => toggleGenre(genre.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all focus:outline-none",
                                        isSelected
                                            ? "border-amber-400 bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-105"
                                            : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                    <span>{genre.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Hidden Inputs for Form submission */}
                {selectedGenres.map((id) => (
                    <input key={`g-${id}`} type="hidden" name="genres" value={id} />
                ))}
                {selectedPlatforms.map((id) => (
                    <input key={`p-${id}`} type="hidden" name="platforms" value={id} />
                ))}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={isPending}
                        className="text-xs font-bold text-slate-400 hover:text-white transition-colors py-2"
                    >
                        Tercihleri sonra ayarlarım, şimdi geç ↗
                    </button>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-8 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-amber-400/20 transition-all hover:bg-amber-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Kaydediliyor...</span>
                            </>
                        ) : (
                            <>
                                <span>Kaydet ve Keşfetmeye Başla</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
