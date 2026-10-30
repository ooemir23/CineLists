"use server";

import { auth } from "@/auth";
import { accessibleProfileId, visibleUserWhere } from "@/lib/profile-access";
import { prisma } from "@/lib/prisma";

export async function getUserStats(userId?: string) {
    try {
        const targetUserId = await accessibleProfileId(userId);
        if (!targetUserId) return null;

        const [watchedMovies, watchedShows, watchedEpisodes] = await Promise.all([
            prisma.watched.count({
                where: {
                    userId: targetUserId,
                    media: { type: "MOVIE" }
                }
            }),
            prisma.watched.count({
                where: {
                    userId: targetUserId,
                    media: { type: "TV" }
                }
            }),
            prisma.watchedEpisode.count({
                where: { userId: targetUserId }
            })
        ]);

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

        const [episodeCounts, watchedMovies, users] = await Promise.all([
            prisma.watchedEpisode.groupBy({
                by: ['userId'],
                where: { userId: { in: userIds }, user: visibleUserWhere(session.user.id, "showStats") },
                _count: { episodeId: true }
            }),
            prisma.watched.findMany({
                where: {
                    userId: { in: userIds },
                    user: visibleUserWhere(session.user.id, "showStats"),
                    media: { type: "MOVIE" }
                },
                select: { userId: true }
            }),
            prisma.user.findMany({
                where: { id: { in: userIds }, ...visibleUserWhere(session.user.id, "showStats") },
                select: { id: true, name: true, image: true }
            }),
        ]);

        const movieCountMap = new Map<string, number>();
        for (const item of watchedMovies) {
            movieCountMap.set(item.userId, (movieCountMap.get(item.userId) || 0) + 1);
        }

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

