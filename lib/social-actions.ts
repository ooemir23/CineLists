"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    const currentUserId = session.user.id;

    if ((session.user as any).isGuest || currentUserId.startsWith("guest_")) {
        return { error: "Takip etmek için giriş yapmalısınız (Misafirler takip edemez)" };
    }

    if (currentUserId === targetUserId) {
        return { error: "Kendinizi takip edemezsiniz" };
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        },
    });

    if (existingFollow) {
        // Unfollow
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });
        revalidatePath(`/profile/${targetUserId}`);
        revalidatePath("/profile");
        return { isFollowing: false };
    } else {
        // Follow
        await prisma.follow.create({
            data: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });

        // Create notification
        await prisma.indicates.create({
            data: {
                userId: targetUserId,
                type: "NEW_FOLLOWER",
                message: `${session.user.name || "Birisi"} seni takip etmeye başladı.`,
                link: `/profile/${currentUserId}`, 
                image: session.user.image,
            }
        });

        revalidatePath(`/profile/${targetUserId}`);
        revalidatePath("/profile");
        return { isFollowing: true };
    }
}

export async function getFollowStatus(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return false;

    const follow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: session.user.id,
                followingId: targetUserId,
            },
        },
    });

    return !!follow;
}

export async function searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            _count: {
                select: { 
                    followedBy: true,
                    achievements: true,
                    activities: true
                },
            },
        },
        take: 10,
    });

    return users.map(u => ({
        ...u,
        followersCount: u._count.followedBy,
        achievementsCount: u._count.achievements,
        activitiesCount: u._count.activities
    }));
}

export async function getGlobalActiveUsers() {
    // Get top 10 users by achievement count + activity count
    // Since we can't easily sum counts in prisma findMany orderBy, 
    // we'll get users with their counts and sort in JS, or just use achievement count for simplicity.
    const users = await prisma.user.findMany({
        take: 10,
        orderBy: [
            { achievements: { _count: 'desc' } },
            { activities: { _count: 'desc' } }
        ],
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            _count: {
                select: { 
                    followedBy: true,
                    achievements: true,
                    activities: true
                }
            }
        }
    });

    return users.map(u => ({
        ...u,
        followersCount: u._count.followedBy,
        achievementsCount: u._count.achievements,
        activitiesCount: u._count.activities
    }));
}

export async function getFriends() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        include: {
            following: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    return following.map(f => f.following);
}
