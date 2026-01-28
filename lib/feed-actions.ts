"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type FeedActivity = {
    id: string;
    type: "WATCHED" | "RATED" | "REVIEWED" | "ADDED_TO_LIST";
    createdAt: Date;
    rating: number | null;
    review: string | null;
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

export async function getFriendsActivity(): Promise<FeedActivity[]> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    // 1. Get IDs of people I follow
    const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
        return [];
    }

    // 2. Fetch recent activities from these users
    const activities = await prisma.activity.findMany({
        where: {
            userId: { in: followingIds },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            media: true,
            episode: {
                select: {
                    id: true,
                    seasonNumber: true,
                    episodeNumber: true,
                    title: true,
                }
            },
            _count: {
                select: { comments: true }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 100, // Fetch more to group properly
    });

    // 3. Group consecutive episode watches
    const groupedActivities: FeedActivity[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];

        if (processed.has(activity.id)) continue;

        // If this is not a TV episode watch, add it as-is
        if (!activity.episode || activity.type !== "WATCHED") {
            groupedActivities.push(activity as unknown as FeedActivity);
            processed.add(activity.id);
            continue;
        }

        // Find consecutive episodes from same user, same show, same season
        const relatedEpisodes = [activity];
        processed.add(activity.id);

        // Look for episodes within 5 minutes of this one
        const timeWindow = 5 * 60 * 1000; // 5 minutes
        const activityTime = new Date(activity.createdAt).getTime();

        for (let j = i + 1; j < activities.length; j++) {
            const nextActivity = activities[j];

            if (processed.has(nextActivity.id)) continue;

            const nextTime = new Date(nextActivity.createdAt).getTime();
            const timeDiff = Math.abs(activityTime - nextTime);

            // Check if it's the same user, same media, same season, and within time window
            if (
                nextActivity.userId === activity.userId &&
                nextActivity.mediaId === activity.mediaId &&
                nextActivity.episode?.seasonNumber === activity.episode.seasonNumber &&
                nextActivity.type === "WATCHED" &&
                timeDiff <= timeWindow
            ) {
                relatedEpisodes.push(nextActivity);
                processed.add(nextActivity.id);
            }
        }

        // If we found multiple episodes, create a grouped activity
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
            } as unknown as FeedActivity);
        } else {
            // Single episode
            groupedActivities.push(activity as unknown as FeedActivity);
        }
    }

    return groupedActivities.slice(0, 20);
}
