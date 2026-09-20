"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Heart, X, Film, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteMedia } from "@/lib/favorite-media-actions";

interface ManageFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFavoriteIds: string[];
  watchedItems?: any[];
  onFavoritesChange?: (newFavorites: string[]) => void;
}

export function ManageFavoritesModal({
  isOpen,
  onClose,
  currentFavoriteIds = [],
  watchedItems = [],
  onFavoritesChange,
}: ManageFavoritesModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "watched">("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(currentFavoriteIds);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteIds(currentFavoriteIds);
  }, [currentFavoriteIds]);

  // Debounced search on TMDB
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || data || []);
        }
      } catch (e) {
        console.warn("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleToggle = async (item: {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    media_type?: string;
  }) => {
    const strId = String(item.id);
    const isFav = favoriteIds.includes(strId);
    const newFavs = isFav
      ? favoriteIds.filter((id) => id !== strId)
      : [strId, ...favoriteIds];

    setFavoriteIds(newFavs);
    setTogglingId(strId);

    try {
      const type = (item.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
      const title = item.title || item.name || "İçerik";
      const res = await toggleFavoriteMedia(
        item.id,
        type,
        title,
        item.poster_path,
        item.backdrop_path
      );

      if (res?.error) {
        setFavoriteIds(favoriteIds); // Revert
        toast.error(res.error);
      } else {
        onFavoritesChange?.(newFavs);
        if (res?.isFavorite) {
          toast.success(`"${title}" favorilere eklendi! Profil kapağı güncellendi.`);
        } else {
          toast.info(`"${title}" favorilerden çıkarıldı.`);
        }
      }
    } catch {
      setFavoriteIds(favoriteIds);
      toast.error("Bir hata oluştu.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Favori Filmlerini Yönet
              </h3>
              <p className="text-xs text-neutral-400">
                Seçtiğin favoriler profil kapağında silik bir sinema kolajı olarak yer alır.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 pt-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === "search"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Film/Dizi Ara
          </button>
          <button
            onClick={() => setActiveTab("watched")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === "watched"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            İzlediklerimden Seç ({watchedItems.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {activeTab === "search" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Favorilere eklemek istediğin film veya diziyi ara..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-400" />
                )}
              </div>

              {/* Search Results Grid */}
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchResults.slice(0, 12).map((item) => {
                    const isFav = favoriteIds.includes(String(item.id));
                    const isToggling = togglingId === String(item.id);
                    return (
                      <div
                        key={item.id}
                        className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 p-2 flex gap-2.5 items-center hover:bg-white/[0.06] transition-all"
                      >
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                          {item.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                              alt={item.title || item.name || ""}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-4 h-4 text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-xs font-bold text-white truncate">
                            {item.title || item.name}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 capitalize">
                            {item.media_type === "tv" ? "Dizi" : "Film"}
                          </p>
                          <button
                            onClick={() => handleToggle(item)}
                            disabled={isToggling}
                            className={`mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isFav
                                ? "bg-rose-500 text-white"
                                : "bg-white/10 hover:bg-white/20 text-neutral-300"
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isFav ? "fill-white" : ""}`} />
                            <span>{isFav ? "Favori" : "Ekle"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Sonuç bulunamadı.
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Favorilerine eklemek istediğin filmleri aratarak seçebilirsin.
                </div>
              )}
            </div>
          )}

          {activeTab === "watched" && (
            <div className="space-y-4">
              {watchedItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {watchedItems.map((w: any) => {
                    const media = w.media;
                    if (!media) return null;
                    const isFav = favoriteIds.includes(String(media.tmdbId));
                    const isToggling = togglingId === String(media.tmdbId);
                    return (
                      <div
                        key={media.tmdbId}
                        className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 p-2 flex gap-2.5 items-center hover:bg-white/[0.06] transition-all"
                      >
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                          {media.posterPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${media.posterPath}`}
                              alt={media.title || ""}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-4 h-4 text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-xs font-bold text-white truncate">
                            {media.title}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 capitalize">
                            {media.type?.toLowerCase() === "tv" ? "Dizi" : "Film"}
                          </p>
                          <button
                            onClick={() =>
                              handleToggle({
                                id: media.tmdbId,
                                title: media.title,
                                poster_path: media.posterPath,
                                backdrop_path: media.backdropPath,
                                media_type: media.type?.toLowerCase() === "tv" ? "tv" : "movie",
                              })
                            }
                            disabled={isToggling}
                            className={`mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isFav
                                ? "bg-rose-500 text-white"
                                : "bg-white/10 hover:bg-white/20 text-neutral-300"
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isFav ? "fill-white" : ""}`} />
                            <span>{isFav ? "Favori" : "Ekle"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Henüz izlediğin bir yapım bulunmuyor.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-black/40">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Toplam {favoriteIds.length} favori seçildi</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all active:scale-95"
          >
            Tamamla
          </button>
        </div>

      </div>
    </div>
  );
}
