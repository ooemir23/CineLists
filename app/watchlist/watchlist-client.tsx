"use client";
import React, { useState, useMemo } from "react";
import WatchedSearchBar from "@/components/watched/watched-search-bar";
import { MediaCard } from "@/components/media/media-card";

interface WatchlistItem {
  id: string;
  media: {
    tmdbId: number;
    title: string;
    posterPath: string;
    type: "MOVIE" | "TV";
  };
  addedAt: string;
}

export default function FilteredWatchlist({ watchlist }: { watchlist: WatchlistItem[] }) {
  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!searchValue) return watchlist;
    return watchlist.filter(item =>
      (item.media.title || "").toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, watchlist]);

  return (
    <>
      <WatchedSearchBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFilterClick={() => setFilterOpen(!filterOpen)}
      />
      {/* Filtre menüsü açılırsa buraya eklenebilir */}
      <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-8" : "flex flex-col gap-4 mt-8"}>
        {filtered.length === 0 ? (
          <div className="text-center text-neutral-500 mt-20 w-full">
            <p className="text-xl font-bold">Sonuç bulunamadı.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <MediaCard
              key={item.id}
              id={item.media.tmdbId}
              title={item.media.title}
              posterPath={item.media.posterPath}
              voteAverage={0}
              type={item.media.type === "MOVIE" ? "movie" : "tv"}
            />
          ))
        )}
      </div>
    </>
  );
}
