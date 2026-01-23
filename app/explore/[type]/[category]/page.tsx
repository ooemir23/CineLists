import { tmdb } from "@/lib/tmdb";
import { MediaCard } from "@/components/media/media-card";
import { MediaFilter } from "@/components/home/media-filter";
import { notFound } from "next/navigation";

type Props = {
    params: Promise<{
        type: string;
        category: string;
    }>;
    searchParams: Promise<{
        year?: string;
        rating?: string;
        provider?: string;
        genre?: string;
    }>;
};

const CATEGORY_NAMES: Record<string, string> = {
    trending: "Trend",
    popular: "Popüler",
    upcoming: "Yakında Vizyona Girecekler",
};

const TYPE_NAMES: Record<string, string> = {
    movie: "Filmler",
    tv: "Diziler",
};

export default async function ExplorePage(props: Props) {
    const params = await props.params;
    const { type, category } = params;

    if (type !== "movie" && type !== "tv") notFound();

    const searchParams = await props.searchParams;
    const { year, rating, provider, genre } = searchParams;

    const isFiltering = year || rating || provider || genre;

    let data;
    if (isFiltering) {
        const discoverParams: Record<string, string> = {
            watch_region: "TR",
            sort_by: "popularity.desc",
        };

        if (year) {
            const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
            discoverParams[yearKey] = year;
        }
        if (rating) discoverParams["vote_average.gte"] = rating;
        if (provider) discoverParams["with_watch_providers"] = provider;
        if (genre) discoverParams["with_genres"] = genre;

        data = await tmdb.discover(type as "movie" | "tv", discoverParams);
    } else {
        if (category === "trending") {
            data = type === "movie" ? await tmdb.getTrendingMovies() : await tmdb.getTrendingTV();
        } else if (category === "popular") {
            data = await tmdb.getPopular(type as "movie" | "tv");
        } else if (category === "upcoming" && type === "movie") {
            data = await tmdb.getUpcomingMovies();
        } else {
            notFound();
        }
    }

    const title = `${CATEGORY_NAMES[category] || ""} ${TYPE_NAMES[type] || ""}`;

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-10 tracking-tight">
                {title}
            </h1>

            <div className="mb-12">
                <MediaFilter />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {data.results.map((item: any) => (
                    <MediaCard
                        key={item.id}
                        id={item.id}
                        title={item.title || item.name}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        type={type as "movie" | "tv"}
                    />
                ))}
            </div>

            {data.results.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-neutral-500 text-lg">Bu kategori veya filtrelere uygun içerik bulunamadı.</p>
                </div>
            )}
        </div>
    );
}
