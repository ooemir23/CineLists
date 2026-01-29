"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Tv, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
};

// Platform mappings for direct URLs (simplified assumption for popular ones)
const PLATFORM_URLS: Record<string, string> = {
    "Netflix": "https://www.netflix.com",
    "Disney Plus": "https://www.disneyplus.com",
    "Amazon Prime Video": "https://www.primevideo.com",
    "Apple TV Plus": "https://www.apple.com/apple-tv-plus",
    "Google Play Movies": "https://play.google.com/store/movies",
    "YouTube": "https://www.youtube.com",
    "BluTV": "https://www.blutv.com",
    "MUBI": "https://mubi.com",
    "Tod": "https://www.todtv.com.tr",
    "Exxen": "https://www.exxen.com",
    "Gain": "https://www.gain.tv"
};

export function WatchProviders({ providers, isGlobal, isGuest }: WatchProvidersProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!providers || (!providers.flatrate && !providers.rent && !providers.buy)) return null;

    const allProviders = [
        ...(providers.flatrate || []),
        ...(providers.buy || []),
        ...(providers.rent || [])
    ];

    // Remove duplicates by provider_id
    const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values());
    const displayProviders = uniqueProviders.slice(0, 2);
    const extraCount = uniqueProviders.length - 2;

    const getProviderUrl = (name: string) => {
        return PLATFORM_URLS[name] || providers.link || "#";
    };

    return (
        <>
            {/* Minimalist Trigger Badge */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative flex flex-col items-center bg-neutral-900/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl hover:bg-neutral-800 hover:border-primary/30 transition-all group shadow-xl min-w-[110px] h-[80px] justify-between overflow-hidden"
            >
                <div className={cn("w-full h-full flex flex-col justify-between transition-all duration-500", isGuest && "blur-md scale-95 opacity-50 select-none pointer-events-none")}>
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity border-b border-white/10 w-full pb-1 text-center mb-auto">
                        Platformlar
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        {displayProviders.map((p) => (
                            <div key={p.provider_id} className="flex flex-col items-center gap-1">
                                <div className="relative w-5 h-5 rounded-md overflow-hidden border border-black/40 shadow-sm transition-transform group-hover:scale-110">
                                    <Image src={`https://image.tmdb.org/t/p/original${p.logo_path}`} alt={p.provider_name} fill className="object-cover" />
                                </div>
                                <span className="text-[7px] font-black text-neutral-500 group-hover:text-neutral-300 transition-colors uppercase tracking-tighter leading-none">
                                    {p.provider_name.split(' ')[0]}
                                </span>
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                <div className="w-5 h-5 rounded-md bg-neutral-800 flex items-center justify-center text-[9px] font-bold text-neutral-400">
                                    +{extraCount}
                                </div>
                                <span className="text-[7px] font-black uppercase tracking-tighter leading-none">Daha</span>
                            </div>
                        )}
                    </div>
                </div>

                {isGuest && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px] z-10 p-1.5 text-center leading-none">
                        <span className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">PLATFORMLAR İÇİN</span>
                        <div className="flex flex-col gap-1 w-full">
                            <Link href="/login" className="bg-primary text-white text-[9px] font-black py-1.5 rounded-lg uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all text-center">
                                Giriş Yap
                            </Link>
                            <Link href="/register" className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-black py-1.5 rounded-lg uppercase tracking-wider backdrop-blur-md transition-all text-center border border-white/10">
                                Kayıt Ol
                            </Link>
                        </div>
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
                                    <p className="text-xs font-bold text-yellow-500/80">Türkiye'de bulunamadı. Diğer ülkelerdeki seçenekler gösteriliyor.</p>
                                </div>
                            )}

                            {providers.flatrate && providers.flatrate.length > 0 && (
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

                            {(providers.buy || providers.rent) && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">Satın Al veya Kirala</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[...(providers.buy || []), ...(providers.rent || [])].reduce((acc: Provider[], curr) => {
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
