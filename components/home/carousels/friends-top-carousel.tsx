"use client";

import { Users } from "lucide-react";
import { MediaCarousel } from "./media-carousel";
import type { FriendStats } from "@/lib/hero-personalization-actions";

interface FriendsTopCarouselProps {
    items: FriendStats[];
}

export function FriendsTopCarousel({ items }: FriendsTopCarouselProps) {
    return (
        <MediaCarousel
            items={items.map(item => ({
                id: item.tmdbId,
                title: item.title,
                posterPath: item.posterPath,
                voteAverage: item.voteAverage,
                mediaType: item.mediaType,
            }))}
            title={`Arkadaşlarının Favorileri (${items.length} içerik)`}
            icon={<Users size={18} />}
            color="text-emerald-400"
        />
    );
}
