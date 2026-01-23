"use client";

import Image from "next/image";

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
};

export function WatchProviders({ providers, isGlobal }: WatchProvidersProps) {
    if (!providers || (!providers.flatrate && !providers.rent && !providers.buy)) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-2">Nereden İzlenir?</h3>
                <p className="text-neutral-400 text-sm italic">Bu içerik için şu an dijital bir sağlayıcı bulunmuyor.</p>
            </div>
        );
    }

    const renderProviderList = (title: string, list?: Provider[]) => {
        if (!list || list.length === 0) return null;

        return (
            <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{title}</span>
                <div className="flex flex-wrap gap-4">
                    {list.map((provider) => (
                        <div key={provider.provider_id} className="flex flex-col items-center gap-2 group">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                                <Image
                                    src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="text-[10px] text-neutral-400 text-center max-w-[60px] leading-tight truncate">
                                {provider.provider_name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Nereden İzlenir?</h3>
                {isGlobal && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-md border border-yellow-500/20">
                        GLOBAL
                    </span>
                )}
            </div>
            {isGlobal && (
                <p className="text-[10px] text-neutral-500 -mt-4 leading-tight">
                    Türkiye'de bulunamadı. Diğer ülkelerdeki seçenekler gösteriliyor.
                </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {renderProviderList("Platformlar", providers.flatrate)}
                {renderProviderList("Kirala", providers.rent)}
                {renderProviderList("Satın Al", providers.buy)}
            </div>
            {providers.link && (
                <div className="pt-2">
                    <a
                        href={providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                    >
                        Tüm seçenekleri gör (JustWatch)
                    </a>
                </div>
            )}
        </div>
    );
}
