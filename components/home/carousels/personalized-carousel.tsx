"use client";

import { Sparkles } from "lucide-react";
import { MediaCarousel } from "./media-carousel";

interface PersonalizedCarouselProps {
    items: any[];
}

export function PersonalizedCarousel({ items }: PersonalizedCarouselProps) {
    return (
        <MediaCarousel
            items={items}
            title="Size Özel Seçim"
            icon={<Sparkles size={18} />}
            color="text-rose-400"
        />
    );
}
