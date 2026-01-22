"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserStats(userId?: string) {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) return null;

    // Counts
    const watchedMovies = await prisma.activity.count({
        where: {
            userId: targetUserId,
            type: "WATCHED",
            media: { type: "MOVIE" }
        }
    });

    const watchedShows = await prisma.activity.count({
        where: {
            userId: targetUserId,
            type: "WATCHED",
            media: { type: "TV" },
            episodeId: null // Count shows (marked as completed generally) based on activity or should we use Watchlist Status?
            // Activity is better for specific "Watched" action timestamp.
            // But usually users mark whole show as watched OR episodes.
            // Let's count Activity where type=TV and episodeId is null (show level watch)
        }
    });

    // Total episodes watched
    // Count distinct episodes in WatchedEpisode
    const watchedEpisodes = await prisma.watchedEpisode.count({
        where: { userId: targetUserId }
    });

    // Also count activities where episodeId is not null (legacy or alternative way)
    // Actually WatchedEpisode is the source of truth for episodes.

    return {
        movieCount: watchedMovies,
        showCount: watchedShows,
        episodeCount: watchedEpisodes
    };
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

    // 2. Movie Counts
    const movieCounts = await prisma.activity.groupBy({
        by: ['userId'],
        where: {
            userId: { in: userIds },
            type: "WATCHED",
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
        const epCount = episodeCounts.find(e => e.userId === user.id)?._count.episodeId || 0;
        const movCount = movieCounts.find(m => m.userId === user.id)?._count.mediaId || 0;

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
