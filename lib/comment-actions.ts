"use server";
import { visibleUserWhere } from "@/lib/profile-access";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

export async function addPersonComment(personId: number, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    if (typeof content !== "string" || content.length > 4000 || !content.trim()) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    try {
        await prisma.comment.create({
            data: {
                userId: session.user.id,
                personId,
                content: content.trim(),
                isSpoiler: false, // Default for now
            },
});

        checkAndUnlockAchievements(session.user.id).catch(console.error);

        revalidatePath(`/person/${personId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding person comment:", error);
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }
}

export async function getPersonComments(personId: number) {
    try {
        const comments = await prisma.comment.findMany({
            where: { personId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return comments;
    } catch (error) {
        console.error("Error fetching person comments:", error);
        return [];
    }
}

export async function addActivityComment(activityId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    if (typeof content !== "string" || content.length > 4000 || !content.trim()) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    const activity = await prisma.activity.findFirst({ where: { id: activityId, user: visibleUserWhere(session.user.id, "showActivities") }, select: { id: true } });
    if (!activity) return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    try {
        const comment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                activityId,
                content: content.trim(),
                isSpoiler: false,
            },
            include: {
                activity: {
                    select: {
                        userId: true,
                        media: {
                            select: {
                                tmdbId: true,
                                title: true,
                                type: true,
                                posterPath: true,
                            }
                        }
                    }
                }
            }
        });

        // Create notification for activity owner if it's not the same user
        if (comment.activity && comment.activity.userId !== session.user.id) {
            const mediaTitle = comment.activity.media?.title || "bir içerik";
            const mediaType = comment.activity.media?.type === "TV" ? "tv" : "movie";
            const mediaLink = comment.activity.media?.tmdbId
                ? `/${mediaType}/${comment.activity.media.tmdbId}?tab=comments`
                : "/feed";

            await prisma.indicates.create({
                data: {
                    userId: comment.activity.userId,
                    type: "NEW_COMMENT",
                        payload: { kind: "comment", name: session.user.name || "", title: mediaTitle, preview: content.slice(0, 60) },
                    message: `${session.user.name || "Birisi"} ${mediaTitle} hakkındaki paylaşımına yorum yaptı: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
                    link: mediaLink,
                    image: comment.activity.media?.posterPath,
                }
            });
        }

        checkAndUnlockAchievements(session.user.id).catch(console.error);

        revalidatePath("/feed");
        return { success: true };
    } catch (error) {
        console.error("Error adding activity comment:", error);
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }
}

export async function getActivityComments(activityId: string) {
    const session = await auth();
    try {
        const comments = await prisma.comment.findMany({
            where: { activityId, activity: { user: visibleUserWhere(session?.user?.id, "showActivities") }, user: visibleUserWhere(session?.user?.id, "showActivities") },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return comments;
    } catch (error) {
        console.error("Error fetching activity comments:", error);
        return [];
    }
}


export async function addEpisodeComment(episodeId: string, content: string, path: string, isSpoiler: boolean = false) {
    const session = await auth();
    if (!session?.user?.id) return { error: getDictionary(await getServerLocale()).common.errorOccurred };

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: getDictionary(await getServerLocale()).common.errorOccurred };
    }

    if (typeof content !== "string" || content.length > 4000 || !content.trim()) return { error: getDictionary(await getServerLocale()).common.errorOccurred };

    try {
        await prisma.comment.create({
            data: {
                userId: session.user.id,
                episodeId,
                content: content.trim(),
                isSpoiler,
            },
        });

        checkAndUnlockAchievements(session.user.id).catch(console.error);

        revalidatePath(path);
        return { success: true };
    } catch (error: any) {
        console.error("Error adding episode comment:", error);
        return { error: error.message || "Yorum eklenirken bir hata oluştu" };
    }
}

export async function getEpisodeComments(episodeId: string) {
    try {
        const comments = await prisma.comment.findMany({
            where: { episodeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return comments;
    } catch (error) {
        console.error("Error fetching episode comments:", error);
        return [];
    }
}
