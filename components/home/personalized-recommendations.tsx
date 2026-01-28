import { MediaCard } from "@/components/media/media-card";
import { MediaRowClient } from "@/components/media/media-row-client";
import { getUserRatingsBulk } from "@/lib/rating-actions";
import { Sparkles, Tv, Monitor, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PersonalizedRecommendationsProps = {
    results: any[];
    reasons: {
        favorites: { id: number; name: string }[];
        organic: { id: number; name: string }[];
        platforms: string[];
    };
};

export async function PersonalizedRecommendations({ results, reasons }: PersonalizedRecommendationsProps) {
    if (!results || results.length === 0) return null;

    const tmdbIds = results.map(i => i.id);
    const userRatingsMap = await getUserRatingsBulk(tmdbIds);

    return (
        <section className="relative mb-12 md:mb-16 group/section">
            {/* Ultra Modern Background Setup */}
            <div className="absolute inset-0 -mx-4 md:-mx-12">
                {/* Main Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-purple-600/5 to-transparent rounded-[3rem] md:rounded-[4rem] border border-white/5 backdrop-blur-[2px]" />

                {/* Dynamic Glow Orbs */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/20 blur-[120px] rounded-full mix-blend-screen animate-pulse pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
            </div>

            <div className="relative z-10 py-8 md:py-12">
                <div className="px-6 md:px-12 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] animate-fade-in">
                                <Sparkles className="w-3.5 h-3.5 fill-amber-400/20" />
                                <span>AI Analiz</span>
                            </div>

                            <Link
                                href="/recommendations"
                                className="group/title block"
                            >
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-3 group-hover/title:text-amber-400 transition-colors duration-500 italic uppercase">
                                    Sizin İçin <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-white">Seçtiklerimiz</span>
                                </h2>
                                <div className="flex items-center gap-3 text-xs font-bold text-neutral-400 group-hover/title:text-white transition-all">
                                    <span>Kişiselleştirilmiş önerilerinizi keşfedin</span>
                                    <div className="w-8 h-[2px] bg-amber-400 group-hover/title:w-16 transition-all duration-500" />
                                    <ChevronRight className="w-4 h-4 text-amber-400" />
                                </div>
                            </Link>
                        </div>

                        <div className="flex flex-col gap-6 lg:items-end">
                            <div className="space-y-4 max-w-lg lg:text-right">
                                <p className="text-base font-medium text-neutral-300 leading-relaxed">
                                    İzleme alışkanlıklarınız ve favori türleriniz analiz edilerek hazırlanan, size en uygun <span className="text-amber-400 font-bold">özel seçki.</span>
                                </p>

                                <div className="flex flex-col gap-3 lg:items-end">
                                    {reasons.platforms.length > 0 && (
                                        <div className="flex flex-wrap lg:justify-end gap-2">
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest w-full lg:text-right mb-1 text-white/40">Seçili Platformlar</span>
                                            {reasons.platforms.map(p => (
                                                <span key={p} className="px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-lg text-[10px] font-bold">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {reasons.favorites.length > 0 && (
                                        <div className="flex flex-wrap lg:justify-end gap-2">
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest w-full lg:text-right mb-1 text-white/40">İlgi Alanlarınız</span>
                                            {reasons.favorites.slice(0, 4).map(g => (
                                                <span key={g.id} className="px-3 py-1 bg-white/5 text-white/70 border border-white/10 rounded-lg text-[10px] font-bold">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {reasons.organic.length > 0 && (
                                        <div className="flex flex-wrap lg:justify-end gap-2">
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest w-full lg:text-right mb-1 text-white/40">En Çok İzlediğiniz</span>
                                            {reasons.organic.slice(0, 3).map(g => (
                                                <span key={g.id} className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-bold">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative group/row">
                    <MediaRowClient>
                        {results.map((item) => (
                            <MediaCard
                                key={`${item.mediaType}-${item.id}`}
                                id={item.id}
                                title={item.title || item.name || "Bilinmiyor"}
                                originalTitle={item.original_title || item.original_name}
                                posterPath={item.poster_path}
                                voteAverage={item.vote_average}
                                userRating={userRatingsMap[item.id]}
                                releaseDate={item.release_date || item.first_air_date}
                                type={item.mediaType}
                            />
                        ))}
                    </MediaRowClient>
                </div>
            </div>
        </section>
    );
}
