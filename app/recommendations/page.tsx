import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { MediaCard } from "@/components/media/media-card";
import { MediaFilter } from "@/components/home/media-filter";
import { Sparkles, Monitor, TrendingUp } from "lucide-react";
import { tmdb } from "@/lib/tmdb";

type RecommendationsPageProps = {
    searchParams: Promise<{
        type?: string;
        year?: string;
        rating?: string;
        provider?: string;
        genre?: string;
    }>;
};

export default async function RecommendationsPage({ searchParams }: RecommendationsPageProps) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const params = await searchParams;
    const type = params.type || "";
    const year = params.year;
    const rating = params.rating;
    const provider = params.provider;
    const genre = params.genre;

    // Get personalized recommendations
    const personalizedData = await getPersonalizedRecommendations(session.user.id);

    let results = personalizedData?.results || [];
    const reasons = personalizedData?.reasons || { genres: [], providers: [] };

    // Apply filters if any are set
    if (year || rating || provider || genre || type) {
        const filterParams: Record<string, string> = {
            language: "tr-TR",
            watch_region: "TR",
            sort_by: "popularity.desc",
        };

        if (!type) {
            // Fetch both movies and TV shows
            if (year) filterParams["primary_release_year"] = year;
            if (rating) filterParams["vote_average.gte"] = rating;
            if (provider) {
                filterParams["with_watch_providers"] = provider;
                filterParams["watch_region"] = "TR";
            }
            if (genre) filterParams["with_genres"] = genre;

            const tvParams = { ...filterParams };
            delete tvParams["primary_release_year"];
            if (year) tvParams["first_air_date_year"] = year;

            const [movieData, tvData] = await Promise.all([
                tmdb.discover("movie", filterParams),
                tmdb.discover("tv", tvParams),
            ]);

            results = [...movieData.results, ...tvData.results].sort((a, b) =>
                (b.popularity || 0) - (a.popularity || 0)
            );
        } else {
            // Single type discover
            if (year) {
                const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
                filterParams[yearKey] = year;
            }
            if (rating) filterParams["vote_average.gte"] = rating;
            if (provider) {
                filterParams["with_watch_providers"] = provider;
                filterParams["watch_region"] = "TR";
            }
            if (genre) filterParams["with_genres"] = genre;

            const data = await tmdb.discover(type as "movie" | "tv", filterParams);
            results = data.results || [];
        }
    }

    return (
        <div className="min-h-screen bg-[#101624] pb-20">
            {/* Header Section */}
            <div className="relative pt-24 pb-12">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full border border-primary/30 mb-4">
                            <Sparkles className="w-4 h-4 text-primary fill-primary/20" />
                            <span className="text-primary font-black text-xs uppercase tracking-widest">
                                Kişiselleştirilmiş
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                            Sizin İçin <span className="text-primary">Seçtiklerimiz</span>
                        </h1>
                        <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto">
                            İzleme alışkanlıklarınıza ve favori türlerinize göre hazırlanan size özel öneriler
                        </p>
                    </div>

                    {/* Reasons Display */}
                    {reasons.genres.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                            <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
                                <TrendingUp className="w-4 h-4" />
                                <span>Tercihleriniz:</span>
                            </div>
                            {reasons.genres.slice(0, 5).map((genre) => (
                                <span
                                    key={genre.id}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
                                >
                                    {genre.name}
                                </span>
                            ))}
                            {reasons.providers.length > 0 && (
                                <span className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Monitor className="w-4 h-4" />
                                    Platformlarınız
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <div className="max-w-7xl mx-auto px-6 mb-12">
                <MediaFilter />
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-6">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10">
                            <Sparkles className="w-16 h-16 text-neutral-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Henüz Öneri Yok
                        </h2>
                        <p className="text-neutral-400 max-w-md">
                            Daha fazla içerik izleyip puanlayarak size özel öneriler oluşturabilirsiniz
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    Önerilen İçerikler
                                </h2>
                                <p className="text-sm text-neutral-500 font-medium mt-1">
                                    {results.length} öneri bulundu
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {results.map((item: any) => (
                                <MediaCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title || item.name}
                                    originalTitle={item.original_title || item.original_name}
                                    posterPath={item.poster_path}
                                    voteAverage={item.vote_average}
                                    type={item.mediaType || type}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
