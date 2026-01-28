import { MediaCard } from "@/components/media/media-card";
import { MediaRowClient } from "@/components/media/media-row-client";
import { getUserRatingsBulk } from "@/lib/rating-actions";
import { Sparkles, Tv, Monitor, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PersonalizedRecommendationsProps = {
    results: any[];
    reasons: {
        genres: { id: number; name: string }[];
        providers: string[];
    };
};

export async function PersonalizedRecommendations({ results, reasons }: PersonalizedRecommendationsProps) {
    if (!results || results.length === 0) return null;

    const tmdbIds = results.map(i => i.id);
    const userRatingsMap = await getUserRatingsBulk(tmdbIds);

    return (
        <div className="mb-12">
            <div className="px-6 md:px-10 mb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 fill-primary/20" />
                            <span>Kişiselleştirilmiş</span>
                        </div>
                        <Link
                            href="/recommendations"
                            className="group/title flex items-center gap-2 hover:gap-3 transition-all"
                        >
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight group-hover/title:text-primary transition-colors">
                                Sizin İçin Seçtiklerimiz
                            </h2>
                            <ChevronRight className="w-8 h-8 text-primary opacity-0 group-hover/title:opacity-100 transition-opacity" />
                        </Link>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {reasons.genres.slice(0, 3).map((genre) => (
                                <span
                                    key={genre.id}
                                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-neutral-400 uppercase tracking-widest"
                                >
                                    {genre.name}
                                </span>
                            ))}
                            {reasons.providers.length > 0 && (
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                                    <Monitor className="w-3 h-3" />
                                    Platformlarına Özel
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-neutral-400 max-w-sm md:text-right">
                        İzleme alışkanlıklarınıza ve favori türlerinize göre hazırlanan size özel seçki.
                    </p>
                </div>
            </div>

            <div className="relative group/row">
                {/* Glow Effect */}
                <div className="absolute inset-x-0 top-0 h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

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
    );
}
