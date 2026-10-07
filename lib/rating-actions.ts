"use server";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { ensureMediaItem } from "@/lib/media-item";

import { withUserTransaction } from "@/lib/user-transaction";
import { mediaKey, type MediaIdentity } from "@/lib/media-key";
import { visibleUserWhere } from "@/lib/profile-access";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { tmdb } from "@/lib/tmdb";
import { Prisma } from "@prisma/client";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

function isPrismaConnectionError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true;
    if (error instanceof Error && error.message.includes("Can't reach database server")) return true;
    return false;
}

export async function rateMedia(tmdbId: number, type: "movie" | "tv", rating: number, title?: string, posterPath?: string | null) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: dict.common.errorOccurred };
    }

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { success: false, error: dict.common.errorOccurred };
    }

    let currentUserId = session.user.id;
    let dbUser = await prisma.user.findUnique({
        where: { id: currentUserId },
    });

    if (!dbUser && (session.user as any).email) {
        dbUser = await prisma.user.findUnique({
            where: { email: (session.user as any).email },
        });
        if (dbUser) currentUserId = dbUser.id;
    }

    if (!dbUser) {
        return { success: false, error: dict.common.errorOccurred };
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
        return { success: false, error: dict.common.errorOccurred };
    }

    try {
        // Find or create MediaItem
        let mediaItem = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId } },
        });

        if (!mediaItem) {
            // If movie/tv title wasn't provided, fetch it
            let finalTitle = title;
            let finalPoster = posterPath;
            let genres: string[] = [];
            let runtime: number | null = null;

            if (!finalTitle) {
                const details = await tmdb.getDetails(type, tmdbId.toString()).catch(() => null);
                if (details) {
                    finalTitle = details.title || details.name;
                    finalPoster = details.poster_path;
                    genres = details.genres?.map((g: any) => g.name) || [];
                    runtime = type === "movie" ? details.runtime : (details.episode_run_time?.[0] || null);
                }
            }

            if (!finalTitle) {
                return { success: false, error: dict.common.errorOccurred };
            }

            mediaItem = await ensureMediaItem({
                data: {
                    tmdbId,
                    type: type === "movie" ? "MOVIE" : "TV",
                    title: finalTitle,
                    posterPath: finalPoster,
                    genres: genres,
                    runtime: runtime,
                },
            });
        }

        // Update/Create Watched entry with rating, and drop any "to watch" entry
        // for the same media so a rated item doesn't sit in both lists at once.
        await withUserTransaction(currentUserId, async tx => {
            await tx.watched.upsert({
                where: {
                    userId_mediaId: {
                        userId: currentUserId,
                        mediaId: mediaItem!.id,
                    },
                },
                update: {
                    rating: rating,
                },
                create: {
                    userId: currentUserId,
                    mediaId: mediaItem!.id,
                    rating: rating,
                },
            });
            await tx.toWatch.deleteMany({
                where: { userId: currentUserId, mediaId: mediaItem!.id },
            });

        // Also create/update Activity for social feed
        const existingActivity = await tx.activity.findFirst({
            where: {
                userId: currentUserId,
                mediaId: mediaItem!.id,
                type: "RATED",
                episodeId: null
            },
        });

        if (existingActivity) {
            await tx.activity.update({
                where: { id: existingActivity.id },
                data: {
                    rating,
                    createdAt: new Date(),
                }
            });
        } else {
            await tx.activity.create({
                data: {
                    userId: currentUserId,
                    mediaId: mediaItem!.id,
                    type: "RATED",
                    rating,
                }
            });
        }

        });

        checkAndUnlockAchievements(currentUserId).catch(console.error);

        revalidatePath(`/${type}/${tmdbId}`);
        revalidatePath("/profile");
        revalidatePath("/stats");

        return { success: true };
    } catch (error) {
        console.error("Rate media error:", error);
        return { success: false, error: dict.common.errorOccurred };
    }
}

export async function getUserRating(tmdbId: number, type: "movie" | "tv" = "movie") {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId } },
            include: {
                watchedBy: {
                    where: { userId: session.user.id },
                    select: { rating: true },
                },
            },
        });

        return mediaItem?.watchedBy[0]?.rating ?? null;
    } catch (error: any) {
        if (process.env.NODE_ENV === "development") {
            console.warn("Get user rating DB unavailable:", error?.message || error);
        }
        return null;
    }
}

export async function getFriendsRatings(tmdbId: number, type: "movie" | "tv" = "movie") {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId } },
        });

        if (!mediaItem) return [];

        // Get friends (people I follow)
        const following = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });

        const friendIds = following.map((f: { followingId: string }) => f.followingId);

        // Get ratings from friends (Now from Watched table)
        const ratings = await prisma.watched.findMany({
            where: {
                mediaId: mediaItem.id,
                userId: { in: friendIds },
                user: visibleUserWhere(session.user.id, "showStats"),
                rating: { not: null },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                rating: "desc",
            },
        });

        return ratings.map((r: any) => ({
            userId: r.user.id,
            userName: r.user.name,
            userImage: r.user.image,
            rating: r.rating,
        }));
    } catch (error: any) {
        if (process.env.NODE_ENV === "development") {
            console.warn("Get friends ratings DB unavailable:", error?.message || error);
        }
        return [];
    }
}

export async function getUserRatingsBulk(items: MediaIdentity[]) {
    const session = await auth();
    if (!session?.user?.id || items.length === 0) {
        return {};
    }

    try {
        const ratings = await prisma.watched.findMany({
            where: {
                userId: session.user.id,
                media: {
                    OR: items.slice(0, 100).map(item => ({ tmdbId: item.id, type: item.type === "tv" ? "TV" as const : "MOVIE" as const }))
                },
                rating: { not: null }
            },
            select: {
                rating: true,
                media: {
                    select: { tmdbId: true, type: true }
                }
            }
        });

        const ratingsMap: Record<string, number> = {};
        ratings.forEach(r => {
            ratingsMap[mediaKey(r.media.tmdbId, r.media.type)] = r.rating!;
        });

        return ratingsMap;
    } catch (error) {
        if (isPrismaConnectionError(error)) {
            return {};
        }
        console.error("Get bulk user ratings error:", error);
        return {};
    }
}

export async function getCommunityRatingsBulk(items: MediaIdentity[]) {
    if (items.length === 0) return {};

    try {
        const ratings = await prisma.watched.findMany({
            where: {
                media: { OR: items.slice(0, 100).map(item => ({ tmdbId: item.id, type: item.type === "tv" ? "TV" as const : "MOVIE" as const })) },
                rating: { not: null },
                user: { isPrivate: false, isSuspended: false, showStats: true }
            },
            select: {
                rating: true,
                media: { select: { tmdbId: true, type: true } }
            }
        });

        const statsMap: Record<string, { average: number; count: number }> = {};

        ratings.forEach(r => {
            const id = mediaKey(r.media.tmdbId, r.media.type);
            if (!statsMap[id]) {
                statsMap[id] = { average: 0, count: 0 };
            }
            statsMap[id].count++;
            statsMap[id].average += r.rating!;
        });

        Object.keys(statsMap).forEach(key => {
            const id = key;
            statsMap[id].average = Number((statsMap[id].average / statsMap[id].count).toFixed(1));
        });

        return statsMap;
    } catch (error) {
        if (isPrismaConnectionError(error)) {
            return {};
        }
        console.error("Get bulk community ratings error:", error);
        return {};
    }
}

export async function getAllMediaRatings(tmdbId: number, type: "movie" | "tv" = "movie") {
    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId } },
        });

        if (!mediaItem) return [];

        const ratings = await prisma.watched.findMany({
            where: {
                mediaId: mediaItem.id,
                rating: { not: null },
                user: { isPrivate: false, isSuspended: false, showStats: true },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    },
                },
            },
            orderBy: {
                rating: "desc",
            },
        });

        return ratings.map(r => ({
            userId: r.user.id,
            userName: r.user.name,
            username: r.user.username,
            userImage: r.user.image,
            rating: r.rating,
        }));
    } catch (error) {
        console.error("Get all media ratings error:", error);
        return [];
    }
}

export async function getEpisodeStatsBulk(tmdbId: number) {
    try {
        const episodes = await prisma.episode.findMany({
            where: { media: { tmdbId } },
            include: {
                activities: { where: { type: "RATED", user: { isPrivate: false, isSuspended: false, showStats: true } }, select: { rating: true } },
                _count: {
                    select: { comments: true }
                }
            }
        });

        const statsMap: Record<string, { rating: number; count: number; comments: number }> = {};
        episodes.forEach(ep => {
            const key = `${ep.seasonNumber}-${ep.episodeNumber}`;
            const ratings = ep.activities.map(a => a.rating).filter((r): r is number => r !== null);
            const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
            statsMap[key] = {
                rating: Number(average.toFixed(1)),
                count: ratings.length,
                comments: ep._count.comments
            };
        });
        return statsMap;
    } catch (error) {
        console.error("Get episode stats bulk error:", error);
        return {};
    }
}
