"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenreTagsProps {
  genres: { id: number; name: string }[];
  favoriteGenreIds: string[];
  onRemove?: (genreId: string) => void;
  isEditable?: boolean;
  maxDisplay?: number;
}

const genreColors: { [key: string]: string } = {
  Action: "bg-red-500/20 text-red-300 border-red-500/30 hover:border-red-500/50",
  Adventure: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:border-orange-500/50",
  Animation: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-500/50",
  Comedy: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:border-yellow-500/50",
  Crime: "bg-slate-500/20 text-slate-300 border-slate-500/30 hover:border-slate-500/50",
  Documentary: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:border-blue-500/50",
  Drama: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:border-purple-500/50",
  Family: "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:border-pink-500/50",
  Fantasy: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/50",
  History: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-500/50",
  Horror: "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:border-rose-500/50",
  Music: "bg-green-500/20 text-green-300 border-green-500/30 hover:border-green-500/50",
  Mystery: "bg-violet-500/20 text-violet-300 border-violet-500/30 hover:border-violet-500/50",
  Romance: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 hover:border-fuchsia-500/50",
  "Science Fiction": "bg-sky-500/20 text-sky-300 border-sky-500/30 hover:border-sky-500/50",
  "TV Movie": "bg-teal-500/20 text-teal-300 border-teal-500/30 hover:border-teal-500/50",
  Thriller: "bg-lime-500/20 text-lime-300 border-lime-500/30 hover:border-lime-500/50",
  War: "bg-gray-500/20 text-gray-300 border-gray-500/30 hover:border-gray-500/50",
  Western: "bg-yellow-700/20 text-yellow-200 border-yellow-700/30 hover:border-yellow-700/50",
};

function getGenreColor(genreName: string): string {
  return genreColors[genreName] || "bg-primary/20 text-primary border-primary/30 hover:border-primary/50";
}

export function GenreTags({
  genres,
  favoriteGenreIds,
  onRemove,
  isEditable = false,
  maxDisplay = 6,
}: GenreTagsProps) {
  const favoriteGenres = genres.filter((g) =>
    favoriteGenreIds.includes(String(g.id))
  );

  if (favoriteGenres.length === 0) {
    return null;
  }

  const displayedGenres = favoriteGenres.slice(0, maxDisplay);
  const hiddenCount = favoriteGenres.length - maxDisplay;

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {displayedGenres.map((genre, index) => (
          <motion.div
            key={genre.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border backdrop-blur-sm transition-all text-[10px] sm:text-xs font-bold whitespace-nowrap",
              getGenreColor(genre.name)
            )}
          >
            {genre.name}
            {isEditable && onRemove && (
              <button
                onClick={() => onRemove(String(genre.id))}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            )}
          </motion.div>
        ))}

        {hiddenCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: displayedGenres.length * 0.05 }}
            className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] sm:text-xs font-bold text-neutral-400 hover:bg-white/10 transition-all cursor-default"
          >
            +{hiddenCount} daha
          </motion.div>
        )}
      </div>
    </div>
  );
}
