"use client";

import { User } from "lucide-react";
import { MediaCarousel } from "./media-carousel";
import type { UpcomingActorProject } from "@/lib/hero-personalization-actions";

interface FavoriteActorsCarouselProps {
    items: UpcomingActorProject[];
}

export function FavoriteActorsCarousel({ items }: FavoriteActorsCarouselProps) {
    // Get unique actor names
    const uniqueActors = Array.from(new Set(items.map(i => i.actorName))).slice(0, 3);
    const actorList = uniqueActors.join(", ");

    return (
        <MediaCarousel
            items={items.map(item => ({
                id: item.id,
                title: item.title,
                posterPath: item.posterPath,
                voteAverage: item.voteAverage,
                mediaType: item.mediaType,
            }))}
            title={`${actorList} Filmleri`}
            icon={<User size={18} />}
            color="text-purple-400"
        />
    );
}
