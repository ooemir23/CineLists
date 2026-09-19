"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type FeedActivity = {
    id: string;
    type: "WATCHED" | "RATED" | "REVIEWED" | "COMMENTED" | "LISTED";
    createdAt: Date;
    rating: number | null;
    review: string | null;
    votes: number;
    content?: string | null; // For comments
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    media: {
        id: string;
        tmdbId: number;
        title: string;
        posterPath: string | null;
        backdropPath: string | null;
        type: "MOVIE" | "TV" | "PERSON";
    };
    episode?: {
        id: string;
        seasonNumber: number;
        episodeNumber: number;
        title: string;
    } | null;
    watchedWith?: string | null;
    recommendedByText?: string | null;
    recommendedBy?: {
        id: string;
        name: string | null;
    } | null;
    platform?: string | null;
    episodeRange?: {
        seasonNumber: number;
        fromEpisode: number;
        toEpisode: number;
        count: number;
        episodeList?: Array<{ number: number; title: string }>;
    } | null;
    _count: {
        comments: number;
    };
};

async function getFriendsActivityForUser(userId: string): Promise<FeedActivity[]> {
    try {
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });

        const followingIds = following.map(f => f.followingId);

        if (followingIds.length === 0) {
            return [];
        }

        // Fetch from multiple sources
        const [activities, comments, watchlist] = await Promise.all([
            // 1. Regular Activities
            prisma.activity.findMany({
                where: { userId: { in: followingIds } },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    media: true,
                    episode: { select: { id: true, seasonNumber: true, episodeNumber: true, title: true } },
                    recommendedBy: { select: { id: true, name: true } },
                    _count: { select: { comments: true } }
                },
                orderBy: { createdAt: "desc" },
                take: 40,
            }),
            // 2. Comments
            prisma.comment.findMany({
                where: { userId: { in: followingIds } },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    activity: { include: { media: true, episode: { select: { id: true, seasonNumber: true, episodeNumber: true, title: true } } } },
                    episode: { include: { media: true } }
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            }),
            // 3. Watchlist (ToWatch)
            prisma.toWatch.findMany({
                where: { userId: { in: followingIds } },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    media: true
                },
                orderBy: { addedAt: "desc" },
                take: 20,
            })
        ]);

        // Map everything to FeedActivity
        const mappedActivities: FeedActivity[] = activities.map(a => a as unknown as FeedActivity);

        const mappedComments: FeedActivity[] = comments.map(c => {
            const media = (c.episode?.media || c.activity?.media) as FeedActivity["media"] | undefined;
            const episode = (c.episode || c.activity?.episode) as FeedActivity["episode"];

            if (!media) return null;

            return {
                id: c.id,
                type: "COMMENTED",
                createdAt: c.createdAt,
                content: c.content,
                user: c.user,
                votes: 0,
                media,
                episode,
                _count: { comments: 0 }
            } as FeedActivity;
        }).filter((a): a is FeedActivity => a !== null);

        const mappedWatchlist: FeedActivity[] = watchlist.map(w => ({
            id: w.id,
            type: "LISTED",
            createdAt: w.addedAt,
            user: w.user,
            votes: 0,
            media: w.media as FeedActivity["media"],
            _count: { comments: 0 }
        } as FeedActivity));

        // Combine and sort
        const allActivities = [...mappedActivities, ...mappedComments, ...mappedWatchlist]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return groupFeedActivities(allActivities).slice(0, 30);
    } catch (error) {
        console.warn("[FeedActions] Friends activity skipped in dev:", error);
        return [];
    }
}

/**
 * Groups consecutive episodes watched by the same user for the same show
 * into a single consolidated binge-watch activity.
 */
function groupFeedActivities(activities: FeedActivity[]): FeedActivity[] {
    const grouped: FeedActivity[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];

        if (processed.has(activity.id)) continue;

        // Only group WATCHED activities with episode details
        if (activity.type !== "WATCHED" || !activity.episode) {
            grouped.push(activity);
            processed.add(activity.id);
            continue;
        }

        const relatedActivities: FeedActivity[] = [activity];
        processed.add(activity.id);

        // Group episodes watched within 24 hours of each other
        const timeWindow = 24 * 60 * 60 * 1000;
        const activityTime = new Date(activity.createdAt).getTime();

        for (let j = i + 1; j < activities.length; j++) {
            const nextActivity = activities[j];

            if (
                processed.has(nextActivity.id) ||
                nextActivity.type !== "WATCHED" ||
                !nextActivity.episode
            ) {
                continue;
            }

            const nextTime = new Date(nextActivity.createdAt).getTime();
            const timeDiff = Math.abs(activityTime - nextTime);

            if (
                nextActivity.user.id === activity.user.id &&
                nextActivity.media.id === activity.media.id &&
                nextActivity.episode.seasonNumber === activity.episode.seasonNumber &&
                timeDiff <= timeWindow
            ) {
                relatedActivities.push(nextActivity);
                processed.add(nextActivity.id);
            }
        }

        if (relatedActivities.length > 1) {
            // Sort by episode number ascending
            const sorted = [...relatedActivities].sort(
                (a, b) => (a.episode?.episodeNumber || 0) - (b.episode?.episodeNumber || 0)
            );

            const episodeNumbers = sorted.map((a) => a.episode!.episodeNumber);
            const minEpisode = Math.min(...episodeNumbers);
            const maxEpisode = Math.max(...episodeNumbers);

            // Latest timestamp for the activity card
            const latestActivity = relatedActivities.reduce((latest, curr) =>
                new Date(curr.createdAt).getTime() > new Date(latest.createdAt).getTime()
                    ? curr
                    : latest,
                activity
            );

            grouped.push({
                ...latestActivity,
                episode: latestActivity.episode,
                episodeRange: {
                    seasonNumber: activity.episode.seasonNumber,
                    fromEpisode: minEpisode,
                    toEpisode: maxEpisode,
                    count: relatedActivities.length,
                    episodeList: sorted.map((a) => ({
                        number: a.episode!.episodeNumber,
                        title: a.episode!.title || `Bölüm ${a.episode!.episodeNumber}`,
                    })),
                },
            });
        } else {
            grouped.push(activity);
        }
    }

    return grouped;
}

const cachedGetFriendsActivityForUser = unstable_cache(
    getFriendsActivityForUser,
    ["friends-activity"],
    { revalidate: 120 }
);

export async function getFriendsActivity(): Promise<FeedActivity[]> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    return cachedGetFriendsActivityForUser(session.user.id);
}

export async function getHomeFeedActivities(userId?: string): Promise<FeedActivity[]> {
    try {
        let activities: FeedActivity[] = [];

        if (userId) {
            activities = await cachedGetFriendsActivityForUser(userId).catch(() => []);
        }

        // Backfill with recent community activities if fewer than 6 grouped items
        if (activities.length < 6) {
            const existingIds = new Set(activities.map((a) => a.id));
            // Fetch more raw items to ensure we get at least 6 distinct groups after episode merging
            const community = await prisma.activity.findMany({
                where: {
                    id: { notIn: Array.from(existingIds) },
                    OR: [
                        { type: "REVIEWED" },
                        { review: { not: null } },
                        { rating: { not: null } },
                        { type: "WATCHED" },
                    ],
                },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    media: true,
                    episode: {
                        select: {
                            id: true,
                            seasonNumber: true,
                            episodeNumber: true,
                            title: true,
                        },
                    },
                    recommendedBy: { select: { id: true, name: true } },
                    _count: { select: { comments: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 40,
            }).catch(() => []);

            const mappedCommunity: FeedActivity[] = community.map((a) => ({
                id: a.id,
                type: a.type as FeedActivity["type"],
                createdAt: a.createdAt,
                rating: a.rating,
                review: a.review,
                votes: a.votes,
                user: a.user,
                media: a.media as unknown as FeedActivity["media"],
                episode: a.episode
                    ? {
                        id: a.episode.id,
                        seasonNumber: a.episode.seasonNumber,
                        episodeNumber: a.episode.episodeNumber,
                        title: a.episode.title || "",
                    }
                    : null,
                recommendedBy: a.recommendedBy,
                _count: a._count,
            }));

            // Group community activities so consecutive episodes of the same show collapse into one card
            const groupedCommunity = groupFeedActivities(mappedCommunity);
            activities = [...activities, ...groupedCommunity];
        }

        return groupFeedActivities(activities).slice(0, 6);
    } catch (error) {
        console.warn("[FeedActions] Error in getHomeFeedActivities:", error);
        return [];
    }
}

