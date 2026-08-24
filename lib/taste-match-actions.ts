"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface GenreMatch {
    genre: string;
    user1Count: number;
    user2Count: number;
    common: number;
    similarity: number;
}

interface TasteMatchResult {
    score: number;
    commonWatched: number;
    commonRated: number;
    genreMatches: GenreMatch[];
    commonMedia: Array<{
        tmdbId: number;
        title: string;
        posterPath: string | null;
        user1Rating: number | null;
        user2Rating: number | null;
    }>;
    recommendations: Array<{
        tmdbId: number;
        title: string;
        posterPath: string | null;
        type: "movie" | "tv";
    }>;
}

async function getUserWatchedMedia(userId: string) {
    return prisma.watched.findMany({
        where: { userId },
        include: {
            media: {
                select: {
                    tmdbId: true,
                    title: true,
                    posterPath: true,
                    genres: true,
                    type: true,
                },
            },
        },
    });
}

async function getUserRatings(userId: string) {
    return prisma.watched.findMany({
        where: { userId, rating: { not: null } },
        include: {
            media: {
                select: {
                    tmdbId: true,
                    title: true,
                    posterPath: true,
                    genres: true,
                    type: true,
                },
            },
        },
    });
}

function calculateGenreSimilarity(user1Genres: Record<string, number>, user2Genres: Record<string, number>) {
    const allGenres = new Set([...Object.keys(user1Genres), ...Object.keys(user2Genres)]);
    const genreMatches: GenreMatch[] = [];

    for (const genre of allGenres) {
        const u1Count = user1Genres[genre] || 0;
        const u2Count = user2Genres[genre] || 0;
        const common = Math.min(u1Count, u2Count);

        genreMatches.push({
            genre,
            user1Count: u1Count,
            user2Count: u2Count,
            common,
            similarity: common > 0 ? (common / Math.max(u1Count, u2Count)) * 100 : 0,
        });
    }

    return genreMatches.sort((a, b) => b.similarity - a.similarity);
}

function calculateRatingCorrelation(
    user1Ratings: Map<string, number>,
    user2Ratings: Map<string, number>
): number {
    const commonIds = [...user1Ratings.keys()].filter((id) => user2Ratings.has(id));

    if (commonIds.length < 3) return 0;

    let sumDiff = 0;

    for (const id of commonIds) {
        const r1 = user1Ratings.get(id)!;
        const r2 = user2Ratings.get(id)!;
        sumDiff += Math.abs(r1 - r2);
    }

    const avgAbsDiff = sumDiff / commonIds.length;

    return Math.max(0, 100 - (avgAbsDiff * 10));
}

export async function calculateTasteMatch(userId1: string, userId2: string): Promise<TasteMatchResult | null> {
    if (userId1 === userId2) return null;

    const [watched1, watched2, ratings1, ratings2] = await Promise.all([
        getUserWatchedMedia(userId1),
        getUserWatchedMedia(userId2),
        getUserRatings(userId1),
        getUserRatings(userId2),
    ]);

    const watched1Set = new Set(watched1.map((w) => w.mediaId));
    const watched2Set = new Set(watched2.map((w) => w.mediaId));

    const commonWatchedIds = [...watched1Set].filter((id) => watched2Set.has(id));

    const commonMedia = commonWatchedIds
        .map((mediaId) => {
            const w1 = watched1.find((w) => w.mediaId === mediaId);
            const w2 = watched2.find((w) => w.mediaId === mediaId);
            return {
                tmdbId: w1!.media.tmdbId,
                title: w1!.media.title,
                posterPath: w1!.media.posterPath,
                user1Rating: w1?.rating || null,
                user2Rating: w2?.rating || null,
            };
        })
        .slice(0, 20);

    const commonRated = commonMedia.filter((m) => m.user1Rating !== null && m.user2Rating !== null).length;

    const genreCounts1: Record<string, number> = {};
    const genreCounts2: Record<string, number> = {};

    watched1.forEach((w) => {
        w.media.genres.forEach((g) => {
            genreCounts1[g] = (genreCounts1[g] || 0) + 1;
        });
    });

    watched2.forEach((w) => {
        w.media.genres.forEach((g) => {
            genreCounts2[g] = (genreCounts2[g] || 0) + 1;
        });
    });

    const genreMatches = calculateGenreSimilarity(genreCounts1, genreCounts2);

    const ratingsMap1 = new Map<string, number>(ratings1.map((r) => [r.mediaId, r.rating!]));
    const ratingsMap2 = new Map<string, number>(ratings2.map((r) => [r.mediaId, r.rating!]));
    const ratingCorrelation = calculateRatingCorrelation(ratingsMap1, ratingsMap2);

    const commonCount = commonWatchedIds.length;
    const totalCount = Math.max(1, watched1.length + watched2.length - commonCount);
    const watchedOverlap = (commonCount / totalCount) * 100;

    const genreScore =
        genreMatches.length > 0
            ? genreMatches
                  .filter((g) => g.common > 0)
                  .slice(0, 5)
                  .reduce((sum, g) => sum + g.similarity, 0) / Math.min(5, genreMatches.filter((g) => g.common > 0).length || 1)
            : 0;

    let finalScore = (watchedOverlap * 0.3) + (genreScore * 0.3) + (ratingCorrelation * 0.4);

    if (commonWatchedIds.length < 3) {
        finalScore = finalScore * (commonWatchedIds.length / 3);
    }

    finalScore = Math.min(100, Math.max(0, Math.round(finalScore)));

    const recommendations = await getRecommendationsFromSimilarUsers(userId1, userId2, commonWatchedIds);

    return {
        score: finalScore,
        commonWatched: commonWatchedIds.length,
        commonRated,
        genreMatches: genreMatches.filter((g) => g.common > 0).slice(0, 6),
        commonMedia: commonMedia.slice(0, 10),
        recommendations,
    };
}

async function getRecommendationsFromSimilarUsers(
    userId1: string,
    userId2: string,
    excludeIds: string[]
) {
    const user2Watched = await prisma.watched.findMany({
        where: { userId: userId2, rating: { gte: 7 } },
        include: { media: { select: { tmdbId: true, title: true, posterPath: true, type: true } } },
        take: 20,
    });

    return user2Watched
        .filter((w) => !excludeIds.includes(w.mediaId))
        .map((w) => ({
            tmdbId: w.media.tmdbId,
            title: w.media.title,
            posterPath: w.media.posterPath,
            type: w.media.type === "MOVIE" ? "movie" as const : "tv" as const,
        }));
}

export async function getTopTasteMatches(userId: string, limit: number = 10) {
    const userWatched = await prisma.watched.findMany({
        where: { userId },
        select: { mediaId: true },
    });

    const watchedMediaIds = userWatched.map((w) => w.mediaId);

    const similarUsers = await prisma.watched.groupBy({
        by: ["userId"],
        where: {
            mediaId: { in: watchedMediaIds },
            userId: { not: userId },
        },
        _count: { mediaId: true },
        orderBy: { _count: { mediaId: "desc" } },
        take: limit * 2,
    });

    const results: Array<{ userId: string; name: string | null; image: string | null; score: number }> = [];

    for (const similar of similarUsers) {
        if (results.length >= limit) break;

        const match = await calculateTasteMatch(userId, similar.userId);
        if (match && match.score > 20) {
            const user = await prisma.user.findUnique({
                where: { id: similar.userId },
                select: { name: true, image: true },
            });

            results.push({
                userId: similar.userId,
                name: user?.name || null,
                image: user?.image || null,
                score: match.score,
            });
        }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function getMyTasteProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const [watched, ratings, genres] = await Promise.all([
        prisma.watched.findMany({
            where: { userId: session.user.id },
            include: { media: { select: { genres: true, type: true } } },
        }),
        prisma.watched.findMany({
            where: { userId: session.user.id, rating: { not: null } },
            select: { rating: true },
        }),
        prisma.watched.findMany({
            where: { userId: session.user.id },
            include: { media: { select: { genres: true } } },
        }),
    ]);

    const genreCounts: Record<string, number> = {};
    genres.forEach((g) => {
        g.media.genres.forEach((genre) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
    });

    const avgRating =
        ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
            : 0;

    return {
        totalWatched: watched.length,
        totalRated: ratings.length,
        averageRating: Math.round(avgRating * 10) / 10,
        favoriteGenres: Object.entries(genreCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([genre, count]) => ({ genre, count })),
        movieCount: watched.filter((w) => w.media.type === "MOVIE").length,
        tvCount: watched.filter((w) => w.media.type === "TV").length,
    };
}