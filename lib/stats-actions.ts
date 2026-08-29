"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserStats(userId?: string) {
    try {
        const session = await auth();
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) return null;

        // Counts from the new lists
        const watchedMovies = await prisma.watched.count({
            where: {
                userId: targetUserId,
                media: { type: "MOVIE" }
            }
        });

        const watchedShows = await prisma.watched.count({
            where: {
                userId: targetUserId,
                media: { type: "TV" }
            }
        });

        // Total episodes watched (still source of truth)
        const watchedEpisodes = await prisma.watchedEpisode.count({
            where: { userId: targetUserId }
        });

        return {
            movieCount: watchedMovies,
            showCount: watchedShows,
            episodeCount: watchedEpisodes
        };
    } catch {
        return {
            movieCount: 0,
            showCount: 0,
            episodeCount: 0
        };
    }
}


export async function getLeaderboard() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Get following IDs + My ID
    const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true }
    });

    const userIds = [session.user.id, ...following.map(f => f.followingId)];

    // Aggregate stats for these users
    // This is expensive with Prisma simple queries. 
    // We can use groupBy on WatchedEpisode and Activity.

    // 1. Episode Counts
    const episodeCounts = await prisma.watchedEpisode.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { episodeId: true }
    });

    // 2. Movie Counts (Now from Watched table)
    const movieCounts = await prisma.watched.groupBy({
        by: ['userId'],
        where: {
            userId: { in: userIds },
            media: { type: "MOVIE" }
        },
        _count: { mediaId: true }
    });


    // 3. User Details
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true }
    });

    // Merge
    const leaderboard = users.map(user => {
        const epCount = episodeCounts.find((e: any) => e.userId === user.id)?._count.episodeId || 0;
        const movCount = movieCounts.find((m: any) => m.userId === user.id)?._count.mediaId || 0;

        // Score calculation? Simple sum for now. 1 Movie = 1 point, 1 Episode = 1 point?
        // Usually Movies are worth more, maybe 3x.
        const score = (movCount * 3) + epCount;

        return {
            user,
            movies: movCount,
            episodes: epCount,
            score
        };
    });

    return leaderboard.sort((a, b) => b.score - a.score);
}

