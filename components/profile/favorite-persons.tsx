"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Person {
  id: string;
  tmdbId: number;
  name: string;
  profilePath: string | null;
}

interface FavoritPersonsProps {
  persons: Person[];
  maxDisplay?: number;
  variant?: "grid" | "horizontal";
}

export function FavoritePersons({
  persons,
  maxDisplay = 8,
  variant = "grid",
}: FavoritPersonsProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (personId: string) => {
    setImageErrors(prev => new Set([...prev, personId]));
  };
  if (persons.length === 0) {
    return (
      <div className="w-full bg-white/5 border border-white/5 border-dashed rounded-2xl p-8 text-center flex flex-col items-center gap-3 backdrop-blur-sm">
        <Heart className="w-8 h-8 text-neutral-600" />
        <p className="text-neutral-500 font-bold">Henüz favori kişi yok.</p>
      </div>
    );
  }

  const displayedPersons = persons.slice(0, maxDisplay);
  const hiddenCount = persons.length - maxDisplay;

  return (
    <div className="w-full space-y-4">
      <div className={cn(
        variant === "grid"
          ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3"
          : "flex gap-3 overflow-x-auto pb-2"
      )}>
        {displayedPersons.map((person, index) => (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={`/person/${person.tmdbId}`}
              className="group flex flex-col items-center gap-2 text-center p-3 rounded-xl border border-white/5 hover:border-primary/30 bg-white/2 hover:bg-white/5 transition-all active:scale-95 backdrop-blur-sm"
            >
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all shadow-lg bg-neutral-800">
                {person.profilePath && !imageErrors.has(person.id) ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${person.profilePath}`}
                    alt={person.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="80px"
                    loading="lazy"
                    onError={() => handleImageError(person.id)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-2">
                {person.name}
              </p>
            </Link>
          </motion.div>
        ))}

        {/* Show More */}
        {hiddenCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: displayedPersons.length * 0.05 }}
            className="flex items-center justify-center p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all cursor-default"
          >
            <div className="text-center">
              <div className="text-lg font-black text-primary">+{hiddenCount}</div>
              <div className="text-[10px] font-bold text-neutral-500">Daha fazla</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
