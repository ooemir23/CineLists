"use client";
import { useState } from "react";
import { ModernSearchHeader } from "@/components/search/modern-search-header";
import { MediaCard } from "@/components/media/media-card";
import { tmdb } from "@/lib/tmdb";
import { Film } from "lucide-react";

export default function ModernSearchPage({ searchParams }: { searchParams: { q?: string, type?: string, year?: string, rating?: string, provider?: string, genre?: string, country?: string } }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: searchParams.type || "movie",
    year: searchParams.year || "",
    minRating: searchParams.rating || "",
    provider: searchParams.provider || "",
    genre: searchParams.genre || "",
    country: searchParams.country || "TR",
  });
  const [query, setQuery] = useState(searchParams.q || "");

  async function fetchResults(newFilters: any, newQuery: string) {
    setLoading(true);
    const params: Record<string, string> = {};
    if (newFilters.year) params["primary_release_year"] = newFilters.year;
    if (newFilters.minRating) params["vote_average.gte"] = newFilters.minRating;
    if (newFilters.provider) params["with_watch_providers"] = newFilters.provider;
    if (newFilters.genre) params["with_genres"] = newFilters.genre;
    if (newFilters.country) params["with_origin_country"] = newFilters.country;
    params["language"] = "tr-TR";
    params["sort_by"] = "popularity.desc";
    params["watch_region"] = newFilters.country || "TR";
    if (newQuery) params["query"] = newQuery;

    let data;
    if (Object.keys(params).length > 1) {
      data = await tmdb.discover(newFilters.type as "movie" | "tv", params);
      setResults(data.results || []);
    } else if (newQuery) {
      data = await tmdb.searchMulti(newQuery);
      setResults((data.results || []).filter((item: any) => item.media_type === "movie" || item.media_type === "tv"));
    } else {
      setResults([]);
    }
    setLoading(false);
  }

  function handleFilterChange(newFilters: any) {
    setFilters(newFilters);
    fetchResults(newFilters, query);
  }

  function handleClear() {
    setFilters({ type: "movie", year: "", minRating: "", provider: "", genre: "", country: "TR" });
    setQuery("");
    setResults([]);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 min-h-screen">
      <ModernSearchHeader
        initialType={filters.type}
        initialYear={filters.year}
        initialRating={filters.minRating}
        initialProvider={filters.provider}
        initialGenre={filters.genre}
        initialCountry={filters.country}
        onChange={handleFilterChange}
        onClear={handleClear}
      />
      {loading ? (
        <div className="flex flex-col items-center justify-center text-neutral-500 mt-20">
          <Film className="w-16 h-16 mb-4 animate-pulse opacity-20" />
          <p className="text-lg">Yükleniyor...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-neutral-500 mt-20">
          <Film className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">Aramaya başlamak için bir şeyler yazın veya filtreleri kullanın</p>
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
              type={filters.type as "movie" | "tv"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
