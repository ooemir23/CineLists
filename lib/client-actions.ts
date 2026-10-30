"use server";

import { tmdb } from "./tmdb";
import { prisma } from "./prisma";

export async function fetchSeasonEpisodes(tmdbId: number, seasonNumber: number) {
    try {
        const [tmdbData, mediaItem] = await Promise.all([
            tmdb.getSeasonDetails(String(tmdbId), seasonNumber),
            prisma.mediaItem.findUnique({
                where: { type_tmdbId: { type: "TV", tmdbId } },
                select: { id: true }
            })
        ]);

        if (!tmdbData || !Array.isArray(tmdbData.episodes)) {
            return { episodes: [] };
        }

        if (mediaItem) {
            const dbEpisodes = await prisma.episode.findMany({
                where: {
                    mediaId: mediaItem.id,
                    seasonNumber
                },
                include: {
                    comments: {
                        include: {
                            user: {
                                select: { id: true, name: true, image: true }
                            }
                        },
                        orderBy: { createdAt: "desc" }
                    },
                    activities: {
                        where: { type: "RATED" },
                        select: { rating: true, userId: true }
                    }
                }
            });

            // Merge DB data into TMDB episodes
            const enrichedEpisodes = tmdbData.episodes.map((ep: any) => {
                const dbEp = dbEpisodes.find(d => d.episodeNumber === ep.episode_number);
                return {
                    ...ep,
                    dbId: dbEp?.id,
                    comments: dbEp?.comments || [],
                    ratings: dbEp?.activities || []
                };
            });

            return { ...tmdbData, episodes: enrichedEpisodes };
        }

        return tmdbData;
    } catch (error) {
        console.error("Fetch season error:", error);
        return { episodes: [] };
    }
}

export async function fetchTrailerKey(mediaType: "movie" | "tv", mediaId: number): Promise<string | null> {
    try {
        const data = await tmdb.getVideos(mediaType, String(mediaId));
        const trailer = data?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
        return trailer?.key || null;
    } catch (error) {
        console.error("Fetch trailer error:", error);
        return null;
    }
}
