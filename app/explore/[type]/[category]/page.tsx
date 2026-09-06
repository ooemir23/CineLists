import { tmdb } from "@/lib/tmdb";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { MediaCard } from "@/components/media/media-card";
import { notFound } from "next/navigation";

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

    // Eğer bir kategori seçilmişse (trending, popular vb.) o kategoriye ait tüm verileri çek
    let initialData;
    let title = "";

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

    // Kategoriye göre title ve data çekme
    if (category === "trending") {
        title = `Trend ${TYPE_NAMES[type]}ler`;
        initialData = type === "movie" ? await tmdb.getTrendingMovies() : await tmdb.getTrendingTV();
    } else if (CATEGORY_NAMES[category]) {
        title = `${CATEGORY_NAMES[category]} ${TYPE_NAMES[type]}ler`;
        // TMDb kütüphanesinde ilgili metotları çağır (getPopular, getTopRated vb.)
        if (category === "popular") initialData = await tmdb.getPopular(type);
        else if (category === "top_rated") initialData = await tmdb.getTopRated(type);
        else if (category === "upcoming" && type === "movie") initialData = await tmdb.getUpcomingMovies();
        else {
            const finalParams = { ...discoverParams };
            if (genre) finalParams.with_genres = genre;
            initialData = await tmdb.discover(type, finalParams);
        }
    } else if (category === "all" || category === "discover") {
        title = `${TYPE_NAMES[type]}leri Keşfet`;
        initialData = await tmdb.discover(type, discoverParams);
    } else {
        // Liste görünümü yerine genel keşfet sayfası mı gösterilmeli?
        // Kullanıcı "seçtiğimiz türler listelensin" dediği için grid görünümü (discover) daha uygun olacaktır.
        title = `${TYPE_NAMES[type]}leri Keşfet`;
        initialData = await tmdb.discover(type, discoverParams);
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-10  pt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                        <span className="hover:text-white transition-colors cursor-pointer">KEŞFET</span>
                        <span>/</span>
                        <span className="text-amber-400">{TYPE_NAMES[type].toUpperCase()}</span>
                        <span>/</span>
                        <span className="text-white">{category.toUpperCase()}</span>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
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

            {/* Pagination placeholder */}
            <div className="mt-20 flex justify-center">
                <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Daha Fazla Göster
                </button>
            </div>
        </div>
    );
}
