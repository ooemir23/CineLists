import Link from "next/link";
import { ChevronRight as ArrowRight } from "lucide-react";
import { MediaCard } from "./media-card";
import { MediaRowClient } from "./media-row-client";
import { getUserRatingsBulk, getCommunityRatingsBulk } from "@/lib/rating-actions";
import { cn } from "@/lib/utils";

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
    runtime?: number;
    media_type?: string;
};

type MediaRowProps = {
    title: string;
    items: MediaItem[];
    type: "movie" | "tv";
    href?: string;
};

export async function MediaRow({ title, items, type, href }: MediaRowProps) {
    const tmdbIds = items.map(i => i.id);
    const [userRatingsMap, communityRatingsMap, metadataMap] = await Promise.all([
        getUserRatingsBulk(tmdbIds),
        getCommunityRatingsBulk(tmdbIds),
        import("@/lib/activity-actions").then(m => m.getMediaMetadataBulk(items.map(i => ({
            id: i.id,
            type: (i.media_type === "tv" || i.media_type === "movie" ? i.media_type : type) as "movie" | "tv"
        }))))
    ]);

    return (
        <div className="py-0">
            {title && (
                <div className={cn("flex items-center justify-between mb-2", href ? "" : "px-6 md:px-10")}>
                    {href ? (
                        <Link href={href} className="flex items-center gap-2 group px-4">
                            <h2 className="text-xl md:text-2xl font-bold text-amber-400 tracking-tight group-hover:text-amber-300 transition-colors">{title}</h2>
                            <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </Link>
                    ) : (
                        <h2 className="text-xl md:text-2xl font-bold text-amber-400 tracking-tight">{title}</h2>
                    )}
                </div>
            )}

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
                        communityRating={communityRatingsMap[item.id]}
                        releaseDate={item.release_date || item.first_air_date}
                        runtime={item.runtime || metadataMap[item.id]?.runtime || undefined}
                        type={(item.media_type === "tv" || item.media_type === "movie" ? item.media_type : type) as "movie" | "tv"}
                    />
                ))}
            </MediaRowClient>
        </div>
    );
}
