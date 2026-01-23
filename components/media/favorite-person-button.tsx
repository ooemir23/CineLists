"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleFavoritePerson } from "@/lib/person-actions";
import { cn } from "@/lib/utils";

type FavoritePersonButtonProps = {
    personId: number;
    name: string;
    profilePath: string | null;
    initialIsFavorite: boolean;
};

export function FavoritePersonButton({
    personId,
    name,
    profilePath,
    initialIsFavorite
}: FavoritePersonButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const result = await toggleFavoritePerson(personId, name, profilePath);
            if (result && "isFavorite" in result) {
                setIsFavorite(!!result.isFavorite);
            }
        } catch (error) {
            console.error("Favori işlemi hatası:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border shrink-0",
                isFavorite
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
            )}
        >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            {isFavorite ? "Favorilerde" : "Favorilere Ekle"}
        </button>
    );
}
