"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserStats(userId?: string) {
    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const session = await auth();
            targetUserId = session?.user?.id;
        }

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
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Get following IDs + My ID
        const following = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true }
        });

        const userIds = [session.user.id, ...following.map(f => f.followingId)];

        // Aggregate stats for these users
        // 1. Episode Counts
        const episodeCounts = await prisma.watchedEpisode.groupBy({
            by: ['userId'],
            where: { userId: { in: userIds } },
            _count: { episodeId: true }
        });

        // 2. Movie Counts (Now from Watched table using findMany because Prisma groupBy does not support relation filters)
        const watchedMovies = await prisma.watched.findMany({
            where: {
                userId: { in: userIds },
                media: { type: "MOVIE" }
            },
            select: { userId: true }
        });

        const movieCountMap = new Map<string, number>();
        for (const item of watchedMovies) {
            movieCountMap.set(item.userId, (movieCountMap.get(item.userId) || 0) + 1);
        }

        // 3. User Details
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, image: true }
        });

        // Merge
        const leaderboard = users.map(user => {
            const epCount = episodeCounts.find((e: { userId: string; _count: { episodeId: number } }) => e.userId === user.id)?._count.episodeId || 0;
            const movCount = movieCountMap.get(user.id) || 0;

            // Score calculation: 1 Movie = 3 points, 1 Episode = 1 point
            const score = (movCount * 3) + epCount;

            return {
                user,
                movies: movCount,
                episodes: epCount,
                score
            };
        });

        return leaderboard.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.warn("[Stats] Error in getLeaderboard:", (error as Error)?.message || error);
        return [];
    }
}

