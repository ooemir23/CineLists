"use client";

import Image from "next/image";
import { Eye, Check, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { markEpisodeAsWatched, removeEpisodeWatch } from "@/lib/tv-actions";

type EpisodeItemProps = {
    tmdbId: number;
    seasonNumber: number;
    episode: any;
    isWatched: boolean;
};

export default function EpisodeItem({ tmdbId, seasonNumber, episode, isWatched: initialIsWatched }: EpisodeItemProps) {
    const [isWatched, setIsWatched] = useState(initialIsWatched);
    const [isPending, startTransition] = useTransition();

    const handleToggleWatch = async () => {
        const newState = !isWatched;
        setIsWatched(newState);

        startTransition(async () => {
            if (newState) {
                await markEpisodeAsWatched(
                    tmdbId,
                    seasonNumber,
                    episode.episode_number,
                    episode.name,
                    episode.overview,
                    episode.still_path,
                    episode.air_date
                );
            } else {
                await removeEpisodeWatch(tmdbId, seasonNumber, episode.episode_number);
            }
        });
    };

    return (
        <div className="flex gap-4 p-4 hover:bg-white/5 transition-colors group">
            {/* Image */}
            <div className="shrink-0 w-32 aspect-video bg-black/40 rounded-lg relative overflow-hidden">
                {episode.still_path ? (
                    <Image src={`https://image.tmdb.org/t/p/w300${episode.still_path}`} alt={episode.name} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">Görsel Yok</div>
                )}
                {isWatched && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <Check className="w-8 h-8 text-green-500 drop-shadow-md" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h4 className="font-bold text-white leading-tight">
                            {episode.episode_number}. {episode.name}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">
                            {episode.air_date?.split("-")[0]} • {episode.runtime ? `${episode.runtime}dk` : ""}
                        </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                            disabled={isPending}
                            onClick={handleToggleWatch}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                isWatched ? "text-green-500 bg-green-500/10 hover:bg-green-500/20" : "text-neutral-400 hover:text-white hover:bg-white/10"
                            )}
                            title={isWatched ? "İzlemeyi kaldır" : "İzlendi işaretle"}
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {episode.overview}
                </p>
            </div>
        </div>
    );
}
