"use server";

import { tmdb } from "./tmdb";
import { prisma } from "./prisma";

export async function fetchSeasonEpisodes(tmdbId: number, seasonNumber: number) {
    try {
        const [tmdbData, mediaItem] = await Promise.all([
            tmdb.getSeasonDetails(String(tmdbId), seasonNumber),
            prisma.mediaItem.findUnique({
                where: { tmdbId },
                select: { id: true }
            })
        ]);

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
