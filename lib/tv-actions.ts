"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { tmdb } from "./tmdb";
import { GENRE_MAP } from "./genres";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

export async function markEpisodeAsWatched(
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    title: string,
    overview: string,
    stillPath: string | null,
    airDate: string | null
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Giriş yapmalısınız" };
        const userId = session.user.id;

        if ((session.user as any).isGuest || userId.startsWith("guest_")) {
            return { success: true };
        }

        // 1. Ensure MediaItem exists and has correct info
        let media = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!media || media.title === "TV Show") {
            const tvDetails = await tmdb.getDetails("tv", String(tmdbId)).catch(() => null);

            if (!media) {
                media = await prisma.mediaItem.create({
                    data: {
                        tmdbId,
                        type: "TV",
                        title: tvDetails?.name || "TV Show",
                        posterPath: tvDetails?.poster_path,
                        backdropPath: tvDetails?.backdrop_path,
                        overview: tvDetails?.overview,
                        voteAverage: tvDetails?.vote_average,
                        genres: tvDetails?.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
                    }
                });
            } else if (media.title === "TV Show" && tvDetails) {
                media = await prisma.mediaItem.update({
                    where: { id: media.id },
                    data: {
                        title: tvDetails.name,
                        posterPath: tvDetails.poster_path,
                        backdropPath: tvDetails.backdrop_path,
                        overview: tvDetails.overview,
                        voteAverage: tvDetails.vote_average,
                        genres: tvDetails.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
                    }
                });
            }
        }

        // 2. Ensure Episode exists
        let episode = await prisma.episode.findUnique({
            where: {
                mediaId_seasonNumber_episodeNumber: {
                    mediaId: media.id,
                    seasonNumber,
                    episodeNumber,
                },
            },
        });

        if (!episode) {
            episode = await prisma.episode.create({
                data: {
                    mediaId: media.id,
                    seasonNumber,
                    episodeNumber,
                    title,
                    overview,
                    stillPath,
                    airDate: airDate ? new Date(airDate) : null,
                },
            });
        }

        // 3. Mark as Watched
        await prisma.watchedEpisode.upsert({
            where: {
                userId_episodeId: {
                    userId,
                    episodeId: episode.id,
                }
            },
            update: { watchedAt: new Date() },
            create: {
                userId,
                episodeId: episode.id,
                watchedAt: new Date()
            }
        });

        // 4. Activity
        const existingActivity = await prisma.activity.findFirst({
            where: {
                userId,
                mediaId: media.id,
                episodeId: episode.id,
                type: "WATCHED"
            }
        });

        if (existingActivity) {
            await prisma.activity.update({
                where: { id: existingActivity.id },
                data: { watchedAt: new Date(), createdAt: new Date() }
            });
        } else {
            await prisma.activity.create({
                data: {
                    userId,
                    mediaId: media.id,
                    episodeId: episode.id,
                    type: "WATCHED",
                    watchedAt: new Date(),
                }
            });
        }

        // 5. Global Status
        const existingGlobalWatch = await prisma.watched.findUnique({
            where: { userId_mediaId: { userId, mediaId: media.id } }
        });

        if (!existingGlobalWatch) {
            await prisma.toWatch.deleteMany({ where: { userId, mediaId: media.id } });
            await prisma.watched.create({
                data: { userId, mediaId: media.id, watchedAt: new Date() }
            });

            // Global Show Activity
            const showActivity = await prisma.activity.findFirst({
                where: { userId, mediaId: media.id, type: "WATCHED", episodeId: null }
            });

            if (!showActivity) {
                await prisma.activity.create({
                    data: { userId, mediaId: media.id, type: "WATCHED", watchedAt: new Date() }
                });
            }
        }

        revalidatePath(`/tv/${tmdbId}`);
        revalidatePath("/profile");
        revalidatePath("/watched");
        revalidatePath("/watchlist");
        revalidatePath("/feed");
        return { success: true };
    } catch (error: any) {
        console.error("Mark episode error:", error);
        return { error: error.message || "Bir hata oluştu" };
    }
}

export async function markSeasonAsWatched(tmdbId: number, seasonNumber: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Giriş yapmalısınız" };
        const userId = session.user.id;

        if ((session.user as any).isGuest || userId.startsWith("guest_")) {
            return { success: true };
        }

        // Get season data from TMDB
        const seasonData = await tmdb.getSeasonDetails(String(tmdbId), seasonNumber);
        if (!seasonData?.episodes) return { error: "Sezon bilgileri alınamadı" };

        // Ensure MediaItem
        let media = await prisma.mediaItem.findUnique({ where: { tmdbId } });
        if (!media || media.title === "TV Show" || media.title === "Dizi") {
            const tvDetails = await tmdb.getDetails("tv", String(tmdbId)).catch(() => null);
            if (!media) {
                media = await prisma.mediaItem.create({
                    data: {
                        tmdbId,
                        type: "TV",
                        title: tvDetails?.name || seasonData.name || "Dizi",
                        posterPath: tvDetails?.poster_path,
                        backdropPath: tvDetails?.backdrop_path,
                        overview: tvDetails?.overview,
                        voteAverage: tvDetails?.vote_average,
                        genres: tvDetails?.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
                    }
                });
            } else if (tvDetails) {
                media = await prisma.mediaItem.update({
                    where: { id: media.id },
                    data: {
                        title: tvDetails.name,
                        posterPath: tvDetails.poster_path,
                        backdropPath: tvDetails.backdrop_path,
                        overview: tvDetails.overview,
                        voteAverage: tvDetails.vote_average,
                        genres: tvDetails.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
                    }
                });
            }
        }

        const mediaId = media.id;

        // Check if all episodes are already watched - if so, unmark them all
        const allEpisodeIds = [];
        for (const ep of seasonData.episodes) {
            let dbEp = await prisma.episode.findUnique({
                where: {
                    mediaId_seasonNumber_episodeNumber: {
                        mediaId,
                        seasonNumber,
                        episodeNumber: ep.episode_number,
                    }
                }
            });

            if (!dbEp) {
                dbEp = await prisma.episode.create({
                    data: {
                        mediaId,
                        seasonNumber,
                        episodeNumber: ep.episode_number,
                        title: ep.name,
                        overview: ep.overview,
                        stillPath: ep.still_path,
                        airDate: ep.air_date ? new Date(ep.air_date) : null,
                    }
                });
            }
            allEpisodeIds.push(dbEp.id);
        }

        // Check how many are watched
        const watchedCount = await prisma.watchedEpisode.count({
            where: {
                userId,
                episodeId: { in: allEpisodeIds }
            }
        });

        const allWatched = watchedCount === allEpisodeIds.length;

        if (allWatched) {
            // UNMARK ALL - Remove all watched episodes and activities
            await prisma.watchedEpisode.deleteMany({
                where: {
                    userId,
                    episodeId: { in: allEpisodeIds }
                }
            });

            await prisma.activity.deleteMany({
                where: {
                    userId,
                    mediaId,
                    episodeId: { in: allEpisodeIds },
                    type: { in: ["WATCHED", "RATED"] }
                }
            });
        } else {
            // MARK ALL - Use batch operations for better performance

            // 1. Batch upsert watched episodes
            const watchedEpisodesToCreate = [];
            const existingWatched = await prisma.watchedEpisode.findMany({
                where: {
                    userId,
                    episodeId: { in: allEpisodeIds }
                },
                select: { episodeId: true }
            });

            const existingWatchedIds = new Set(existingWatched.map(w => w.episodeId));

            for (const episodeId of allEpisodeIds) {
                if (!existingWatchedIds.has(episodeId)) {
                    watchedEpisodesToCreate.push({
                        userId,
                        episodeId,
                        watchedAt: new Date()
                    });
                }
            }

            if (watchedEpisodesToCreate.length > 0) {
                await prisma.watchedEpisode.createMany({
                    data: watchedEpisodesToCreate,
                    skipDuplicates: true
                });

                checkAndUnlockAchievements(userId).catch(console.error);
            }

            // Update existing ones
            if (existingWatchedIds.size > 0) {
                await prisma.watchedEpisode.updateMany({
                    where: {
                        userId,
                        episodeId: { in: Array.from(existingWatchedIds) }
                    },
                    data: { watchedAt: new Date() }
                });
            }

            // 2. Batch create WATCHED activities
            const existingActivities = await prisma.activity.findMany({
                where: {
                    userId,
                    mediaId,
                    episodeId: { in: allEpisodeIds },
                    type: "WATCHED"
                },
                select: { episodeId: true }
            });

            const existingActivityIds = new Set(existingActivities.map(a => a.episodeId));
            const activitiesToCreate = [];

            for (const episodeId of allEpisodeIds) {
                if (!existingActivityIds.has(episodeId)) {
                    activitiesToCreate.push({
                        userId,
                        mediaId,
                        episodeId,
                        type: "WATCHED" as const,
                        watchedAt: new Date()
                    });
                }
            }

            if (activitiesToCreate.length > 0) {
                await prisma.activity.createMany({
                    data: activitiesToCreate,
                    skipDuplicates: true
                });
            }

            // 3. Global Show Status
            await prisma.watched.upsert({
                where: { userId_mediaId: { userId, mediaId } },
                update: { watchedAt: new Date() },
                create: { userId, mediaId, watchedAt: new Date() }
            });

            await prisma.toWatch.deleteMany({ where: { userId, mediaId } });
        }

        revalidatePath(`/tv/${tmdbId}`);
        revalidatePath("/profile");
        revalidatePath("/watched");
        revalidatePath("/watchlist");
        revalidatePath("/feed");

        return { success: true };
    } catch (error: any) {
        console.error("Mark season error:", error);
        return { error: error.message || "Bir hata oluştu" };
    }
}

export async function removeEpisodeWatch(tmdbId: number, seasonNumber: number, episodeNumber: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Giriş yapmalısınız" };
        const userId = session.user.id;

        if ((session.user as any).isGuest || userId.startsWith("guest_")) {
            return { success: true };
        }

        const media = await prisma.mediaItem.findUnique({ where: { tmdbId } });
        if (!media) return { error: "Medya bulunamadı" };

        const episode = await prisma.episode.findUnique({
            where: {
                mediaId_seasonNumber_episodeNumber: {
                    mediaId: media.id,
                    seasonNumber,
                    episodeNumber,
                }
            }
        });

        if (!episode) return { error: "Bölüm kaydı yok" };

        await prisma.watchedEpisode.deleteMany({
            where: { userId, episodeId: episode.id }
        });

        await prisma.activity.deleteMany({
            where: { userId, episodeId: episode.id, type: "WATCHED" }
        });

        revalidatePath(`/tv/${tmdbId}`);
        revalidatePath("/feed");
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Bir hata oluştu" };
    }
}

export async function getWatchedEpisodes(tmdbId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const media = await prisma.mediaItem.findUnique({ where: { tmdbId } });
        if (!media) return [];

        const watched = await prisma.watchedEpisode.findMany({
            where: {
                userId: session.user.id,
                episode: { mediaId: media.id }
            },
            include: {
                episode: { select: { seasonNumber: true, episodeNumber: true } }
            }
        });

        return watched.map(w => ({ s: w.episode.seasonNumber, e: w.episode.episodeNumber }));
    } catch (error) {
        return [];
    }
}

export async function ensureEpisodeExists(params: {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    overview: string;
    stillPath: string | null;
    airDate: string | null;
}) {
    const { tmdbId, seasonNumber, episodeNumber, title, overview, stillPath, airDate } = params;

    let media = await prisma.mediaItem.findUnique({ where: { tmdbId } });
    if (!media || media.title === "TV Show") {
        const tvDetails = await tmdb.getDetails("tv", String(tmdbId)).catch(() => null);
        if (!media) {
            media = await prisma.mediaItem.create({
                data: {
                    tmdbId,
                    type: "TV",
                    title: tvDetails?.name || "TV Show",
                    posterPath: tvDetails?.poster_path,
                    backdropPath: tvDetails?.backdrop_path,
                    overview: tvDetails?.overview,
                    voteAverage: tvDetails?.vote_average,
                    genres: tvDetails?.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
                }
            });
        } else if (tvDetails) {
            media = await prisma.mediaItem.update({
                where: { id: media.id },
                data: {
                    title: tvDetails.name,
                    posterPath: tvDetails.poster_path,
                    backdropPath: tvDetails.backdrop_path,
                    overview: tvDetails.overview,
                    voteAverage: tvDetails.vote_average,
                    genres: tvDetails.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
                }
            });
        }
    }

    let episode = await prisma.episode.findUnique({
        where: {
            mediaId_seasonNumber_episodeNumber: {
                mediaId: media.id,
                seasonNumber,
                episodeNumber,
            },
        },
    });

    if (!episode) {
        episode = await prisma.episode.create({
            data: {
                mediaId: media.id,
                seasonNumber,
                episodeNumber,
                title,
                overview,
                stillPath,
                airDate: airDate ? new Date(airDate) : null,
            },
        });
    }
    return episode;
}

export async function rateEpisode(params: {
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    rating: number;
    title: string;
    overview: string;
    stillPath: string | null;
    airDate: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Giriş yapmalısınız" };
        const userId = session.user.id;

        if ((session.user as any).isGuest || userId.startsWith("guest_")) {
            return { success: true };
        }

        const episode = await ensureEpisodeExists(params);

        const existingRating = await prisma.activity.findFirst({
            where: { userId, mediaId: episode.mediaId, episodeId: episode.id, type: "RATED" }
        });

        if (existingRating) {
            if (existingRating.rating === params.rating) {
                await prisma.activity.delete({ where: { id: existingRating.id } });
            } else {
                await prisma.activity.update({
                    where: { id: existingRating.id },
                    data: { rating: params.rating, createdAt: new Date() }
                });
            }
        } else {
            await prisma.activity.create({
                data: {
                    userId,
                    mediaId: episode.mediaId,
                    episodeId: episode.id,
                    type: "RATED",
                    rating: params.rating,
                    watchedAt: new Date()
                }
            });
        }

        revalidatePath(`/tv/${params.tmdbId}`);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Bir hata oluştu" };
    }
}
