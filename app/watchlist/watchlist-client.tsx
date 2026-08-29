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
      <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6 mt-6" : "flex flex-col gap-3 mt-6"}>
        {filtered.length === 0 ? (
          <div className="text-center text-neutral-500 py-16 w-full col-span-full">
            <p className="text-lg font-bold">Sonuç bulunamadı.</p>
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
