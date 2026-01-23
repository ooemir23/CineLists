import { MediaCard } from "@/components/media/media-card";
import { SearchInput } from "@/components/search/search-input";
import { tmdb } from "@/lib/tmdb";
import { Film } from "lucide-react";

type SearchPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage(props: SearchPageProps) {
    const searchParams = await props.searchParams;
    const query = searchParams.q;
    let results: any[] = [];

    if (query) {
        const data = await tmdb.searchMulti(query);
        results = data.results.filter(
            (item: any) => item.media_type === "movie" || item.media_type === "tv"
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 md:py-16 min-h-screen">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                Keşfet & Ara
            </h1>

            <div className="max-w-2xl mx-auto mb-16">
                <SearchInput />
            </div>

            {!query ? (
                <div className="flex flex-col items-center justify-center text-neutral-500 mt-20">
                    <Film className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg">Aramaya başlamak için bir şeyler yazın</p>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center text-neutral-400 mt-20">
                    <p>"{query}" için sonuç bulunamadı.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {results.map((item: any) => (
                        <MediaCard
                            key={item.id}
                            id={item.id}
                            title={item.title || item.name}
                            originalTitle={item.original_title || item.original_name}
                            posterPath={item.poster_path}
                            voteAverage={item.vote_average}
                            type={item.media_type}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
