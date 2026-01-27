import { tmdb } from "@/lib/tmdb";
import { MediaRow } from "@/components/media/media-row";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { MediaCard } from "@/components/media/media-card";
import { notFound } from "next/navigation";

const TYPE_NAMES = {
    movie: "Filmler",
    tv: "TV Dizileri",
};

const CATEGORY_NAMES = {
    popular: "Popüler",
    top_rated: "En İyi Puanlı",
    upcoming: "Yakında",
    now_playing: "Şimdi Oynuyor",
    airing_today: "Bugün Yayınlanan",
    on_the_air: "Yayınlanan",
};

interface Props {
    params: Promise<{ type: "movie" | "tv"; category: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Page(props: Props) {
    // Sunucu tarafında ilk yükleme için verileri çek
    const params = await props.params;
    const { type, category } = params;
    if (type !== "movie" && type !== "tv") notFound();
    const searchParams = await props.searchParams;
    const { year, rating, provider, genre, country } = searchParams;
    const isFiltering = year || rating || provider || genre;

    // Eğer filtreleme varsa eski davranışı koru
    if (isFiltering) {
        const discoverParams: Record<string, string> = {
            watch_region: country || "TR",
            sort_by: "popularity.desc",
        };
        if (year) {
            const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
            discoverParams[yearKey] = year;
        }
        if (rating) discoverParams["vote_average.gte"] = rating;
        if (provider) discoverParams["with_watch_providers"] = provider;
        if (genre) discoverParams["with_genres"] = genre;
        const initialData = await tmdb.discover(type as "movie" | "tv", discoverParams);
        return (
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-10 tracking-tight">
                    {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || ""} {TYPE_NAMES[type] || ""}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-8">
                    {initialData.results.map((item: any) => (
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
                {initialData.results.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-neutral-500 text-lg">Bu kategori veya filtrelere uygun içerik bulunamadı.</p>
                    </div>
                )}
            </div>
        );
    }

    // --- Keşfet için gruplu öneriler ---
    // 1. Türlere göre
    const genresData = await tmdb.getGenres(type as "movie" | "tv");
    const genres = genresData.genres?.slice(0, 5) || [];
    const genreRows = await Promise.all(
        genres.map(async (genre: any) => {
            const data = await tmdb.discover(type as "movie" | "tv", {
                with_genres: String(genre.id),
                sort_by: "popularity.desc",
                watch_region: "TR",
            });
            return { genre, items: data.results.slice(0, 10) };
        })
    );

    // 2. İzleme servislerine göre (ilk 5 sağlayıcıyı çek)
    // TMDb'de popüler sağlayıcılar için /api/watch-providers/ route'unu kullanıyorsunuz, burada örnek bir fetch yapılabilir
    let providers: any[] = [];
    try {
        const res = await fetch(`/api/watch-providers?type=${type}&country=TR`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            providers = (data.results || []).slice(0, 5);
        }
    } catch {}
    const providerRows = await Promise.all(
        providers.map(async (provider) => {
            const data = await tmdb.discover(type as "movie" | "tv", {
                with_watch_providers: String(provider.provider_id),
                sort_by: "popularity.desc",
                watch_region: "TR",
            });
            return { provider, items: data.results.slice(0, 10) };
        })
    );

    // 3. Trendler
    const trendingData = type === "movie" ? await tmdb.getTrendingMovies() : await tmdb.getTrendingTV();

    // 4. Popüler
    const popularData = await tmdb.getPopular(type as "movie" | "tv");

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-10 tracking-tight">
                Keşfet: {TYPE_NAMES[type] || ""}
            </h1>

            {/* Trendler */}
            <div className="mb-10">
                <MediaRow
                    title="Trendler"
                    items={trendingData.results.slice(0, 10)}
                    type={type as "movie" | "tv"}
                />
            </div>

            {/* Popüler */}
            <div className="mb-10">
                <MediaRow
                    title="Popüler"
                    items={popularData.results.slice(0, 10)}
                    type={type as "movie" | "tv"}
                />
            </div>

            {/* Türlere göre */}
            {genreRows.map(row => (
                <div className="mb-10" key={row.genre.id}>
                    <MediaRow
                        title={`Tür: ${row.genre.name}`}
                        items={row.items}
                        type={type as "movie" | "tv"}
                    />
                </div>
            ))}

            {/* İzleme Servislerine göre */}
            {providerRows.map(row => (
                <div className="mb-10" key={row.provider.provider_id}>
                    <MediaRow
                        title={`Servis: ${row.provider.provider_name}`}
                        items={row.items}
                        type={type as "movie" | "tv"}
                    />
                </div>
            ))}
        </div>
    );
}
