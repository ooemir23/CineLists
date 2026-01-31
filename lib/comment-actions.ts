"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPersonComment(personId: number, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: "Yorum yapmak için giriş yapmalısınız" };
    }

    if (!content.trim()) {
        return { error: "Yorum boş olamaz" };
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

        revalidatePath(`/person/${personId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding person comment:", error);
        return { error: "Yorum eklenirken bir hata oluştu" };
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
        return { error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: "Yorum yapmak için giriş yapmalısınız" };
    }

    if (!content.trim()) {
        return { error: "Yorum boş olamaz" };
    }

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
                    }
                }
            }
        });

        // Create notification for activity owner if it's not the same user
        if (comment.activity && comment.activity.userId !== session.user.id) {
            await prisma.indicates.create({
                data: {
                    userId: comment.activity.userId,
                    type: "NEW_COMMENT",
                    message: `${session.user.name || "Birisi"} paylaşımına yorum yaptı: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
                    link: "/feed", // Or a link to specific activity if we have one
                }
            });
        }

        revalidatePath("/feed");
        return { success: true };
    } catch (error) {
        console.error("Error adding activity comment:", error);
        return { error: "Yorum eklenirken bir hata oluştu" };
    }
}

export async function getActivityComments(activityId: string) {
    try {
        const comments = await prisma.comment.findMany({
            where: { activityId },
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
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: "Yorum yapmak için giriş yapmalısınız" };
    }

    if (!content.trim()) return { error: "Yorum boş olamaz" };

    try {
        await prisma.comment.create({
            data: {
                userId: session.user.id,
                episodeId,
                content: content.trim(),
                isSpoiler,
            },
        });

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
