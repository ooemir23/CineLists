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
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 20,
    });

    return activities as unknown as FeedActivity[];
}
