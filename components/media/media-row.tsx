import Link from "next/link";
import { ChevronRight as ArrowRight } from "lucide-react";
import { MediaCard } from "./media-card";
import { MediaRowClient } from "./media-row-client";
import { getUserRatingsBulk } from "@/lib/rating-actions";

type MediaItem = {
    id: number;
    title?: string;
    original_title?: string;
    name?: string; // TV shows use name
    original_name?: string;
    poster_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
};

type MediaRowProps = {
    title: string;
    items: MediaItem[];
    type: "movie" | "tv";
    href?: string;
};

export async function MediaRow({ title, items, type, href }: MediaRowProps) {
    const tmdbIds = items.map(i => i.id);
    const userRatingsMap = await getUserRatingsBulk(tmdbIds);

    return (
        <div className="py-0">
            <div className="flex items-center justify-between px-6 md:px-10 mb-2">
                {href ? (
                    <Link href={href} className="flex items-center gap-2 group">
                        <h2 className="text-xl md:text-2xl font-bold text-amber-400 tracking-tight group-hover:text-primary transition-colors">{title}</h2>
                        <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </Link>
                ) : (
                    <h2 className="text-xl md:text-2xl font-bold text-amber-400 tracking-tight">{title}</h2>
                )}
            </div>

            <MediaRowClient>
                {items.map((item) => (
                    <MediaCard
                        key={item.id}
                        id={item.id}
                        title={item.title || item.name || "Bilinmiyor"}
                        originalTitle={item.original_title || item.original_name}
                        posterPath={item.poster_path}
                        voteAverage={item.vote_average}
                        userRating={userRatingsMap[item.id]}
                        releaseDate={item.release_date || item.first_air_date}
                        type={type}
                    />
                ))}
            </MediaRowClient>
        </div>
    );
}
