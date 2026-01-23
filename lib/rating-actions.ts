"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rateMedia(tmdbId: number, type: "movie" | "tv", rating: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Verify user exists in DB
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!dbUser) {
        return { error: "Oturum geçersiz, lütfen tekrar giriş yapın." };
    }

    if (rating < 0 || rating > 10) {
        return { error: "Rating must be between 0 and 10" };
    }

    try {
        // Find or create MediaItem
        let mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!mediaItem) {
            return { error: "Media not found in watchlist" };
        }

        // Update WatchlistItem with rating
        await prisma.watchlistItem.update({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: mediaItem.id,
                },
            },
            data: {
                userRating: rating,
            },
        });

        // Also create/update Activity for social feed
        await prisma.activity.upsert({
            where: {
                userId_mediaId_type: {
                    userId: session.user.id,
                    mediaId: mediaItem.id,
                    type: "RATED",
                },
            },
            create: {
                userId: session.user.id,
                mediaId: mediaItem.id,
                type: "RATED",
                rating,
            },
            update: {
                rating,
                createdAt: new Date(), // Update timestamp when rating changes
            },
        });

        revalidatePath(`/${type}/${tmdbId}`);
        return { success: true };
    } catch (error) {
        console.error("Rate media error:", error);
        return { error: "Failed to rate media" };
    }
}

export async function getUserRating(tmdbId: number, type: "movie" | "tv") {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
            include: {
                watchlistItems: {
                    where: { userId: session.user.id },
                    select: { userRating: true },
                },
            },
        });

        return mediaItem?.watchlistItems[0]?.userRating ?? null;
    } catch (error) {
        console.error("Get user rating error:", error);
        return null;
    }
}

export async function getFriendsRatings(tmdbId: number, type: "movie" | "tv") {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!mediaItem) return [];

        // Get friends (people I follow)
        const following = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });

        const friendIds = following.map((f: { followingId: string }) => f.followingId);

        // Get ratings from friends
        const ratings = await prisma.watchlistItem.findMany({
            where: {
                mediaId: mediaItem.id,
                userId: { in: friendIds },
                userRating: { not: null },
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
                userRating: "desc",
            },
        });

        return ratings.map((r: any) => ({
            userId: r.user.id,
            userName: r.user.name,
            userImage: r.user.image,
            rating: r.userRating,
        }));
    } catch (error) {
        console.error("Get friends ratings error:", error);
        return [];
    }
}

export async function getUserRatingsBulk(tmdbIds: number[]) {
    const session = await auth();
    if (!session?.user?.id || tmdbIds.length === 0) {
        return {};
    }

    try {
        const ratings = await prisma.watchlistItem.findMany({
            where: {
                userId: session.user.id,
                media: {
                    tmdbId: { in: tmdbIds }
                },
                userRating: { not: null }
            },
            select: {
                userRating: true,
                media: {
                    select: { tmdbId: true }
                }
            }
        });

        const ratingsMap: Record<number, number> = {};
        ratings.forEach(r => {
            ratingsMap[r.media.tmdbId] = r.userRating!;
        });

        return ratingsMap;
    } catch (error) {
        console.error("Get bulk user ratings error:", error);
        return {};
    }
}
