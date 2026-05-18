import { getUserRatingsBulk } from "@/lib/rating-actions";
import { Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PersonalizedRecommendationsClient } from "./personalized-recommendations-client";

type PersonalizedRecommendationsProps = {
    results: Array<{
        id: number;
        title?: string;
        name?: string;
        original_title?: string;
        original_name?: string;
        poster_path?: string | null;
        vote_average?: number;
        release_date?: string;
        first_air_date?: string;
        mediaType: "movie" | "tv";
        runtime?: number;
    }>;
    reasons: {
        favorites: { id: number; name: string }[];
        organic: { id: number; name: string }[];
        platforms: string[];
    };
};

export async function PersonalizedRecommendations({ results, reasons }: PersonalizedRecommendationsProps) {
    if (!results || results.length === 0) return null;

    const tmdbIds = results.map(i => i.id);
    const [userRatingsMap, metadataMap] = await Promise.all([
        getUserRatingsBulk(tmdbIds),
        import("@/lib/activity-actions").then(m => m.getMediaMetadataBulk(results.map(r => ({ id: r.id, type: r.mediaType || (r as any).media_type || "movie" }))))
    ]);

    const normalizedResults = results.map((item) => ({
        ...item,
        mediaType: item.mediaType || (item as any).media_type || "movie",
    }));

    return (
        <section className="relative group/section">
            {/* Elegant Compact Background */}
            <div className="absolute inset-0 -mx-4 md:-mx-8">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-[1.75rem] md:rounded-[2.5rem] border border-white/5 backdrop-blur-[2px]" />
                <div className="absolute top-0 right-0 w-[300px] h-full bg-amber-500/5 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
            </div>

            <div className="relative z-10 py-3 md:py-4">
                <div className="px-3 md:px-8 mb-4 md:mb-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                        <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 rounded-lg text-amber-400 font-bold text-[9px] uppercase tracking-[0.2em]">
                                <Sparkles className="w-3 h-3 fill-amber-400/20" />
                                <span>Size Özel Analiz</span>
                            </div>

                            <Link href="/recommendations" className="group/title flex items-center gap-4">
                                <h2 className="text-xl min-[390px]:text-2xl md:text-3xl font-black text-white tracking-tight group-hover/title:text-amber-400 transition-colors uppercase italic">
                                    Sizin İçin <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Seçtiklerimiz</span>
                                </h2>
                                <ChevronRight className="w-5 h-5 text-amber-400 group-hover/title:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-2 md:gap-4 md:justify-end items-center">
                            {reasons.platforms.length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest border-r border-white/10 pr-2 mr-1">Platform</span>
                                    <div className="flex gap-1.5">
                                        {reasons.platforms.slice(0, 3).map(p => (
                                            <span key={p} className="text-[10px] font-bold text-amber-400">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {reasons.favorites.length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest border-r border-white/10 pr-2 mr-1">İlgi</span>
                                    <div className="flex gap-1.5">
                                        {reasons.favorites.slice(0, 2).map(g => (
                                            <span key={g.id} className="text-[10px] font-bold text-white/80">
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative group/row">
                    <PersonalizedRecommendationsClient
                        results={normalizedResults}
                        userRatingsMap={userRatingsMap}
                        metadataMap={metadataMap}
                    />
                </div>
            </div>
        </section>
    );
}
