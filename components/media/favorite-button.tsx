"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleFavoriteMedia } from "@/lib/favorite-media-actions";

export interface FavoriteButtonProps {
  tmdbId: number | string;
  type?: "movie" | "tv";
  title?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  initialIsFavorite?: boolean;
  variant?: "full" | "icon" | "compact";
  className?: string;
  onToggle?: (isFav: boolean) => void;
}

export function FavoriteButton({
  tmdbId,
  type = "movie",
  title,
  posterPath,
  backdropPath,
  initialIsFavorite = false,
  variant = "full",
  className,
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;
    setIsLoading(true);

    // Optimistic update
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const res = await toggleFavoriteMedia(tmdbId, type, title, posterPath, backdropPath);
      if (res?.error) {
        setIsFavorite(!nextState); // Revert
        toast.error(res.error);
      } else {
        const finalState = !!res?.isFavorite;
        setIsFavorite(finalState);
        onToggle?.(finalState);
        if (finalState) {
          toast.success("Favorilere eklendi! Profil kapağında yer alacak.");
        } else {
          toast.info("Favorilerden çıkarıldı.");
        }
      }
    } catch (err: any) {
      setIsFavorite(!nextState);
      toast.error(err?.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
          isFavorite
            ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-500/10"
            : "bg-black/60 backdrop-blur-md text-white/80 border-white/10 hover:text-rose-400 hover:border-rose-500/30",
          className
        )}
      >
        <Heart className={cn("w-5 h-5 transition-transform", isFavorite && "fill-rose-500 text-rose-500 scale-110")} />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95",
          isFavorite
            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
            : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-rose-300",
          className
        )}
      >
        <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-rose-500 text-rose-500")} />
        <span>{isFavorite ? "Favorilerde" : "Favori"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border shrink-0 active:scale-95 shadow-md",
        isFavorite
          ? "bg-gradient-to-r from-rose-600/90 to-pink-600/90 text-white border-rose-500 shadow-rose-600/20"
          : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-rose-500/30",
        className
      )}
    >
      <Heart className={cn("w-4 h-4 transition-transform", isFavorite && "fill-current text-white scale-110")} />
      <span>{isFavorite ? "Favorilerde" : "Favorilere Ekle"}</span>
    </button>
  );
}
