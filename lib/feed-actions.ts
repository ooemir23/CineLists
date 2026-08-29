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

        // 3. Group consecutive episode watches (only for activities)
        const groupedActivities: FeedActivity[] = [];
        const processed = new Set<string>();

        for (let i = 0; i < allActivities.length; i++) {
            const activity = allActivities[i];

            if (processed.has(activity.id)) continue;

            // Grouping logic only for WATCHED activities
            if (activity.type !== "WATCHED" || !activity.episode) {
                groupedActivities.push(activity);
                processed.add(activity.id);
                continue;
            }

            const relatedEpisodes = [activity];
            processed.add(activity.id);

            const timeWindow = 10 * 60 * 1000; // Expanded to 10 minutes for grouping
            const activityTime = new Date(activity.createdAt).getTime();

            for (let j = i + 1; j < allActivities.length; j++) {
                const nextActivity = allActivities[j];

                if (processed.has(nextActivity.id) || nextActivity.type !== "WATCHED" || !nextActivity.episode) continue;

                const nextTime = new Date(nextActivity.createdAt).getTime();
                const timeDiff = Math.abs(activityTime - nextTime);

                if (
                    nextActivity.user.id === activity.user.id &&
                    nextActivity.media.id === activity.media.id &&
                    nextActivity.episode.seasonNumber === activity.episode.seasonNumber &&
                    timeDiff <= timeWindow
                ) {
                    relatedEpisodes.push(nextActivity);
                    processed.add(nextActivity.id);
                }
            }

            if (relatedEpisodes.length > 1) {
                const episodeNumbers = relatedEpisodes
                    .map(a => a.episode!.episodeNumber)
                    .sort((a, b) => a - b);

                const minEpisode = Math.min(...episodeNumbers);
                const maxEpisode = Math.max(...episodeNumbers);

                groupedActivities.push({
                    ...activity,
                    episodeRange: {
                        seasonNumber: activity.episode.seasonNumber,
                        fromEpisode: minEpisode,
                        toEpisode: maxEpisode,
                        count: relatedEpisodes.length
                    }
                });
            } else {
                groupedActivities.push(activity);
            }
        }

        return groupedActivities.slice(0, 30);
    } catch (error) {
        console.warn("[FeedActions] Friends activity skipped in dev:", error);
        return [];
    }
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
