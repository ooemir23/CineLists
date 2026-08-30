"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Tv, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCountryName } from "@/lib/country";

type Provider = {
    provider_id: number;
    provider_name: string;
    logo_path: string;
};

type WatchProvidersProps = {
    providers: {
        flatrate?: Provider[];
        rent?: Provider[];
        buy?: Provider[];
        link?: string;
    } | null;
    isGlobal?: boolean;
    isGuest?: boolean;
    countryCode?: string;
    mediaTitle?: string;
};

export function WatchProviders({ providers, isGlobal, isGuest, countryCode = "TR", mediaTitle }: WatchProvidersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const allProviders = [
        ...(providers?.flatrate || []),
        ...(providers?.buy || []),
        ...(providers?.rent || [])
    ];

    const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values());
    const displayProviders = uniqueProviders.slice(0, 2);
    const extraCount = uniqueProviders.length - 2;

    const getProviderUrl = (providerName: string) => {
        const q = mediaTitle ? encodeURIComponent(mediaTitle.trim()) : "";
        const name = (providerName || "").toLowerCase();

        if (name.includes("prime") || name.includes("amazon")) {
            return q ? `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}` : "https://www.primevideo.com";
        }
        if (name.includes("netflix")) {
            return q ? `https://www.netflix.com/search?q=${q}` : "https://www.netflix.com";
        }
        if (name.includes("disney")) {
            return q ? `https://www.disneyplus.com/search?q=${q}` : "https://www.disneyplus.com";
        }
        if (name.includes("apple")) {
            return q ? `https://tv.apple.com/search?term=${q}` : "https://tv.apple.com";
        }
        if (name.includes("blutv") || (name.includes("max") && !name.includes("hbo"))) {
            return q ? `https://www.blutv.com/arama?q=${q}` : "https://www.blutv.com";
        }
        if (name.includes("max") || name.includes("hbo")) {
            return q ? `https://play.max.com/search?q=${q}` : "https://play.max.com";
        }
        if (name.includes("tod")) {
            return q ? `https://www.todtv.com.tr/arama?q=${q}` : "https://www.todtv.com.tr";
        }
        if (name.includes("exxen")) {
            return q ? `https://www.exxen.com/tr/search?q=${q}` : "https://www.exxen.com";
        }
        if (name.includes("gain")) {
            return q ? `https://www.gain.tv/arama?q=${q}` : "https://www.gain.tv";
        }
        if (name.includes("mubi")) {
            return q ? `https://mubi.com/tr/search/films?query=${q}` : "https://mubi.com";
        }
        if (name.includes("tv+") || name.includes("turkcell")) {
            return q ? `https://tvplus.com.tr/arama?q=${q}` : "https://tvplus.com.tr";
        }
        if (name.includes("hulu")) {
            return q ? `https://www.hulu.com/search?q=${q}` : "https://www.hulu.com";
        }
        if (name.includes("peacock")) {
            return q ? `https://www.peacocktv.com/search?q=${q}` : "https://www.peacocktv.com";
        }
        if (name.includes("paramount")) {
            return q ? `https://www.paramountplus.com/search/?query=${q}` : "https://www.paramountplus.com";
        }
        if (name.includes("crunchyroll")) {
            return q ? `https://www.crunchyroll.com/search?q=${q}` : "https://www.crunchyroll.com";
        }
        if (name.includes("google play") || name.includes("google tv")) {
            return q ? `https://play.google.com/store/search?q=${q}&c=movies` : "https://play.google.com/store/movies";
        }
        if (name.includes("youtube")) {
            return q ? `https://www.youtube.com/results?search_query=${q}+izle` : "https://www.youtube.com";
        }

        return providers?.link || (q ? `https://www.google.com/search?q=${q}+${encodeURIComponent(providerName)}+izle` : "#");
    };

    const hasProviders = uniqueProviders.length > 0;
    const showRed = isGlobal || !hasProviders;
    const activeCountryCode = (countryCode || "TR").toUpperCase();
    const countryName = getCountryName(activeCountryCode);

    const handleTriggerClick = (e: React.MouseEvent) => {
        if (isGuest) return; // Guest handle by Link inside
        
        if (uniqueProviders.length === 1) {
            window.open(getProviderUrl(uniqueProviders[0].provider_name), "_blank");
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            {/* ── Trigger ── */}
            <button
                onClick={handleTriggerClick}
                title={hasProviders ? "İzleme Seçenekleri" : `${countryName}'de yayınlanan herhangi bir platformda bulunmuyor`}
                className={cn(
                    "relative flex items-center justify-center gap-2 px-3 py-2 rounded-2xl transition-all group overflow-hidden border w-full",
                    showRed 
                        ? "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30" 
                        : "bg-white/[0.06] border-white/10 hover:bg-white/[0.10] hover:border-white/20"
                )}
            >
                {isGuest ? (
                    <div className="flex items-center gap-2 blur-sm select-none pointer-events-none">
                        <Tv className={cn("w-4 h-4", showRed ? "text-rose-400/30" : "text-white/30")} />
                        <span className={cn("text-xs font-black uppercase tracking-wider", showRed ? "text-rose-400/30" : "text-white/30")}>Platform</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 w-full">
                        {/* Platform logos */}
                        {hasProviders ? (
                            <>
                                <div className="flex items-center -space-x-1.5">
                                    {displayProviders.map((p) => (
                                        <div
                                            key={p.provider_id}
                                            className={cn(
                                                "relative w-7 h-7 rounded-full overflow-hidden border-2 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform",
                                                showRed ? "border-red-900/50" : "border-[#0f1623]"
                                            )}
                                            title={p.provider_name}
                                        >
                                            <Image
                                                src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                alt={p.provider_name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                    {extraCount > 0 && (
                                        <div className={cn(
                                            "relative w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black flex-shrink-0",
                                            showRed ? "bg-red-500/20 border-red-900/50 text-red-400/60" : "bg-white/10 border-[#0f1623] text-white/60"
                                        )}>
                                            +{extraCount}
                                        </div>
                                    )}
                                </div>
                                <Tv className={cn(
                                    "w-3.5 h-3.5 transition-colors shrink-0",
                                    showRed ? "text-rose-400/40 group-hover:text-rose-400/60" : "text-white/25 group-hover:text-white/50"
                                )} />
                            </>
                        ) : (
                            <div className="flex items-center justify-center gap-1.5 text-rose-400/80">
                                <Tv className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-tight">{activeCountryCode}&apos;de Yayın Yok</span>
                            </div>
                        )}
                    </div>
                )}

                {isGuest && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] z-10">
                        <Link href="/login" className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-colors">
                            Giriş Yap
                        </Link>
                    </div>
                )}
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-8 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Tv className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">İzleme Seçenekleri</h2>
                                    <p className="text-sm font-bold text-neutral-500">Platforma gitmek için logoya tıklayınız</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-all hover:scale-110 active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {isGlobal && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                    <p className="text-xs font-bold text-yellow-500/80">Türkiye&rsquo;de bulunamadı. Diğer ülkelerdeki seçenekler gösteriliyor.</p>
                                </div>
                            )}

                            {providers?.flatrate && providers.flatrate.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Abonelik İle İzle</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {providers.flatrate.map((p) => (
                                            <a
                                                key={p.provider_id}
                                                href={getProviderUrl(p.provider_name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all group"
                                            >
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                                    <Image src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} fill className="object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white leading-tight group-hover:text-primary transition-colors">{p.provider_name}</span>
                                                    <span className="text-[8px] font-black text-neutral-500 flex items-center gap-0.5 mt-0.5 group-hover:text-neutral-400">GİT <ExternalLink className="w-2 h-2" /></span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(providers?.buy || providers?.rent) && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Satın Al veya Kirala</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[...(providers?.buy || []), ...(providers?.rent || [])].reduce((acc: Provider[], curr) => {
                                            if (!acc.find(p => p.provider_id === curr.provider_id)) acc.push(curr);
                                            return acc;
                                        }, []).map((p) => (
                                            <a
                                                key={p.provider_id}
                                                href={getProviderUrl(p.provider_name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all group"
                                            >
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all">
                                                    <Image src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} fill className="object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors leading-tight">{p.provider_name}</span>
                                                    <span className="text-[8px] font-black text-neutral-600 flex items-center gap-0.5 mt-0.5 group-hover:text-neutral-400">GİT <ExternalLink className="w-2 h-2" /></span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
