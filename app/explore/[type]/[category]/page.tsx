import { tmdb } from "@/lib/tmdb";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { MediaCard } from "@/components/media/media-card";
import { notFound } from "next/navigation";
import Link from "next/link";

const TYPE_NAMES = {
    movie: "Film",
    tv: "Dizi",
};

const CATEGORY_NAMES: Record<string, string> = {
    trending: "Trend",
    popular: "Popüler",
    top_rated: "En İyi Puanlı",
    upcoming: "Yakında Gelecek",
    now_playing: "Vizyondakiler",
    airing_today: "Bugün Yayınlananlar",
    on_the_air: "Yayındakiler",
};

interface Props {
    params: Promise<{ type: "movie" | "tv"; category: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Page(props: Props) {
    const params = await props.params;
    const { type, category } = params;
    if (type !== "movie" && type !== "tv") notFound();

    const searchParams = await props.searchParams;
    const { year, rating, provider, genre, country } = searchParams;
    const page = Math.min(Math.max(parseInt(searchParams.page || "1", 10) || 1, 1), 500);
    const pageParams: Record<string, string> = { page: String(page) };
    const hasFilters = Boolean(year || rating || provider || genre);

    // Eğer bir kategori seçilmişse (trending, popular vb.) o kategoriye ait tüm verileri çek
    let initialData;
    let title = "";

    const discoverParams: Record<string, string> = {
        watch_region: country || "TR",
        sort_by: category === "top_rated" ? "vote_average.desc" : "popularity.desc",
        page: String(page),
    };
    if (category === "top_rated") discoverParams["vote_count.gte"] = "200";
    if (year) {
        const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
        discoverParams[yearKey] = year;
    }
    if (rating) discoverParams["vote_average.gte"] = rating;
    if (provider) discoverParams["with_watch_providers"] = provider;
    if (genre) discoverParams["with_genres"] = genre;

    // Kategoriye göre title ve data çekme.
    // Filtre seçiliyse TMDB'nin kategori uç noktaları filtre desteklemediği için discover kullanılır.
    if (category === "trending") {
        title = `Trend ${TYPE_NAMES[type]}ler`;
        initialData = hasFilters
            ? await tmdb.discover(type, discoverParams)
            : await tmdb.getTrending(type, "day", pageParams);
    } else if (CATEGORY_NAMES[category]) {
        title = `${CATEGORY_NAMES[category]} ${TYPE_NAMES[type]}ler`;
        if (hasFilters) initialData = await tmdb.discover(type, discoverParams);
        else if (category === "popular") initialData = await tmdb.getPopular(type, pageParams);
        else if (category === "top_rated") initialData = await tmdb.getTopRated(type, pageParams);
        else if (category === "upcoming" && type === "movie") initialData = await tmdb.getUpcomingMovies(pageParams);
        else if (category === "now_playing" && type === "movie") initialData = await tmdb.getNowPlayingMovies(pageParams);
        else initialData = await tmdb.discover(type, discoverParams);
    } else {
        title = `${TYPE_NAMES[type]}leri Keşfet`;
        initialData = await tmdb.discover(type, discoverParams);
    }

    const totalPages = Math.min(initialData?.total_pages || 1, 500);
    const pageHref = (target: number) => {
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(searchParams)) {
            if (value && key !== "page") qs.set(key, value);
        }
        if (target > 1) qs.set("page", String(target));
        const query = qs.toString();
        return `/explore/${type}/${category}${query ? `?${query}` : ""}`;
    };
    const categoryLabel = CATEGORY_NAMES[category] || "Keşfet";

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10 pb-28 md:pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-10">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                        <Link href="/search" className="hover:text-white transition-colors">KEŞFET</Link>
                        <span>/</span>
                        <span className="text-amber-400">{TYPE_NAMES[type].toUpperCase()}</span>
                        <span>/</span>
                        <span className="text-white">{categoryLabel.toLocaleUpperCase("tr-TR")}</span>
                    </nav>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                        {title}
                    </h1>
                </div>
            </div>

            <ExploreFilterBar />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                {initialData?.results?.map((item: any) => (
                    <MediaCard
                        key={item.id}
                        id={item.id}
                        title={item.title || item.name}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        type={type as "movie" | "tv"}
                        releaseDate={item.release_date || item.first_air_date}
                        fullWidth
                    />
                ))}
            </div>

            {(!initialData || initialData.results?.length === 0) && (
                <div className="text-center py-32 bg-white/5 rounded-[40px] border border-white/10">
                    <p className="text-neutral-500 text-xl font-bold uppercase tracking-widest">
                        Bu kategori veya filtrelere uygun içerik bulunamadı.
                    </p>
                </div>
            )}

            {/* Sayfalama */}
            {totalPages > 1 && (
                <nav aria-label="Sayfalama" className="mt-12 sm:mt-20 flex items-center justify-center gap-3">
                    {page > 1 && (
                        <Link
                            href={pageHref(page - 1)}
                            className="px-5 sm:px-8 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Önceki
                        </Link>
                    )}
                    <span className="text-xs font-bold text-neutral-500 tabular-nums">
                        {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link
                            href={pageHref(page + 1)}
                            className="px-5 sm:px-8 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Daha Fazla Göster
                        </Link>
                    )}
                </nav>
            )}
        </div>
    );
}
