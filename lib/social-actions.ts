"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

export async function toggleFollow(targetUserId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Giriş yapmalısınız" };
        }

        let currentUserId = session.user.id;

        if ((session.user as any).isGuest || currentUserId.startsWith("guest_")) {
            return { error: "Takip etmek için giriş yapmalısınız (Misafirler takip edemez)" };
        }

        // Verify current user in DB (resolves Google sub vs cuid issue)
        let currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { id: true, name: true, image: true }
        });

        if (!currentUser && session.user.email) {
            currentUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, name: true, image: true }
            });
            if (currentUser) {
                currentUserId = currentUser.id;
            }
        }

        if (!currentUser) {
            return { error: "Kullanıcı hesabınız veritabanında bulunamadı. Lütfen tekrar giriş yapın." };
        }

        if (currentUserId === targetUserId) {
            return { error: "Kendinizi takip edemezsiniz" };
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true }
        });

        if (!targetUser) {
            return { error: "Takip edilmek istenen kullanıcı bulunamadı" };
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
            revalidatePath("/community");
            return { isFollowing: false };
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            });

            checkAndUnlockAchievements(currentUserId).catch((e) => console.warn("[Achievements] Check failed:", e));

            // Create notification safely
            try {
                await prisma.indicates.create({
                    data: {
                        userId: targetUserId,
                        type: "NEW_FOLLOWER",
                        message: `${currentUser.name || "Birisi"} seni takip etmeye başladı.`,
                        link: `/profile/${currentUserId}`, 
                        image: currentUser.image,
                    }
                });
            } catch (notifErr) {
                console.warn("[Social] Follow notification creation warning:", notifErr);
            }

            revalidatePath(`/profile/${targetUserId}`);
            revalidatePath("/profile");
            revalidatePath("/community");
            return { isFollowing: true };
        }
    } catch (error) {
        console.error("[Social] Error in toggleFollow:", error);
        return { error: (error as Error)?.message || "İşlem sırasında bir hata oluştu" };
    }
}

export async function getFollowStatus(targetUserId: string) {
    try {
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
    } catch (error) {
        console.warn("[Social] Error in getFollowStatus:", (error as Error)?.message || error);
        return false;
    }
}

export async function searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    try {
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
    } catch (error) {
        console.warn("[Social] Error in searchUsers:", (error as Error)?.message || error);
        return [];
    }
}

export async function getGlobalActiveUsers() {
    try {
        // Get top 10 users by achievement count + activity count
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
                    },
                }
            }
        });

        return users.map(u => ({
            ...u,
            followersCount: u._count.followedBy,
            achievementsCount: u._count.achievements,
            activitiesCount: u._count.activities
        }));
    } catch (error) {
        console.warn("[Social] Error in getGlobalActiveUsers:", (error as Error)?.message || error);
        return [];
    }
}

export async function getFriends() {
    try {
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
    } catch (error) {
        console.warn("[Social] Error in getFriends:", (error as Error)?.message || error);
        return [];
    }
}
