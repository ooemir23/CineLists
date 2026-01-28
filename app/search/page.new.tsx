import { tmdb } from "@/lib/tmdb";
import { MediaCard } from "@/components/media/media-card";
import { Film, Search } from "lucide-react";
import { MediaFilter } from "@/components/home/media-filter";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    year?: string;
    rating?: string;
    provider?: string;
    genre?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const type = params.type || "";
  const year = params.year;
  const rating = params.rating;
  const provider = params.provider;
  const genre = params.genre;

  let results: any[] = [];
  let loading = false;

  // If there's a search query or filters, fetch results
  if (query || year || rating || provider || genre || type) {
    const searchParams: Record<string, string> = {
      language: "tr-TR",
      watch_region: "TR",
    };

    // If there's a query, use search
    if (query) {
      const data = await tmdb.searchMulti(query);
      // If type is specified, filter by type; otherwise show all
      results = type
        ? (data.results || []).filter((item: any) => item.media_type === type)
        : (data.results || []);
    } else {
      // No query, use discover with filters
      if (!type) {
        // Fetch both movies and TV shows
        if (year) searchParams["primary_release_year"] = year;
        if (rating) searchParams["vote_average.gte"] = rating;
        if (provider) {
          searchParams["with_watch_providers"] = provider;
          searchParams["watch_region"] = "TR";
        }
        if (genre) searchParams["with_genres"] = genre;
        searchParams["sort_by"] = "popularity.desc";

        const tvParams = { ...searchParams };
        delete tvParams["primary_release_year"];
        if (year) tvParams["first_air_date_year"] = year;

        const [movieData, tvData] = await Promise.all([
          tmdb.discover("movie", searchParams),
          tmdb.discover("tv", tvParams),
        ]);

        results = [...movieData.results, ...tvData.results].sort((a, b) =>
          (b.popularity || 0) - (a.popularity || 0)
        );
      } else {
        // Single type discover
        if (year) {
          const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
          searchParams[yearKey] = year;
        }
        if (rating) searchParams["vote_average.gte"] = rating;
        if (provider) {
          searchParams["with_watch_providers"] = provider;
          searchParams["watch_region"] = "TR";
        }
        if (genre) searchParams["with_genres"] = genre;
        searchParams["sort_by"] = "popularity.desc";
        const data = await tmdb.discover(type as "movie" | "tv", searchParams);
        results = data.results || [];
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#101624] pb-20">
      {/* Header Section */}
      <div className="relative pt-24 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full border border-primary/30 mb-4">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-primary font-black text-xs uppercase tracking-widest">
                Keşfet & Ara
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
              Ne Arıyorsun<span className="text-primary">?</span>
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto">
              Milyonlarca film ve dizi arasından istediğini bul veya filtrelerle keşfet
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <MediaFilter />
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-6">
        {!query && !year && !rating && !provider && !genre ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10">
              <Search className="w-16 h-16 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Aramaya Başla
            </h2>
            <p className="text-neutral-400 max-w-md">
              Yukarıdaki arama kutusunu kullanarak film veya dizi ara, ya da filtreleri kullanarak keşfet
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10">
              <Film className="w-16 h-16 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Sonuç Bulunamadı
            </h2>
            <p className="text-neutral-400 max-w-md">
              Aradığınız kriterlere uygun içerik bulunamadı. Farklı filtreler deneyin
            </p>
          </div>
        ) : (
          <div>
            {(() => {
              const people = results.filter((item: any) => (item.media_type || type) === "person");
              const media = results.filter((item: any) => (item.media_type || type) !== "person");

              return (
                <>
                  {people.length > 0 && (
                    <div className="mb-16">
                      <div className="mb-8 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        <div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                            Sanatçılar
                          </h2>
                          <p className="text-sm text-neutral-500 font-medium">
                            {people.length} sanatçı bulundu
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                        {people.map((item: any) => (
                          <div key={item.id} className="transform hover:scale-105 transition-transform duration-300">
                            <MediaCard
                              id={item.id}
                              title={item.title || item.name}
                              originalTitle={item.original_title || item.original_name}
                              posterPath={item.poster_path || item.profile_path}
                              voteAverage={item.vote_average || 0}
                              type="person"
                              fullWidth={true}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {media.length > 0 && (
                    <div>
                      <div className="mb-8 flex items-center gap-3">
                        <div className="w-2 h-8 bg-white/20 rounded-full" />
                        <div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                            İçerikler
                          </h2>
                          <p className="text-sm text-neutral-500 font-medium">
                            {media.length} film ve dizi bulundu
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {media.map((item: any) => (
                          <MediaCard
                            key={item.id}
                            id={item.id}
                            title={item.title || item.name}
                            originalTitle={item.original_title || item.original_name}
                            posterPath={item.poster_path || item.profile_path}
                            voteAverage={item.vote_average || 0}
                            type={(item.media_type || type) as "movie" | "tv"}
                            fullWidth={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {people.length === 0 && media.length === 0 && (
                    <div className="text-center py-20 text-neutral-500">
                      Sonuç bulunamadı
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
