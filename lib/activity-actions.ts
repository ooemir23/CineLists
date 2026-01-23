"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleWatchedStatus(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!dbUser) {
        return { error: "Oturum geçersiz, lütfen tekrar giriş yapın." };
    }

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: type === "movie" ? "MOVIE" : "TV",
                title: title,
                posterPath: posterPath,
            },
        });
    }

    // Check current status
    const existingEntry = await prisma.watchlistItem.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    const isCurrentlyWatched = existingEntry?.status === "COMPLETED";

    if (isCurrentlyWatched) {
        // Toggle OFF (Revert to PLAN_TO_WATCH)
        await prisma.watchlistItem.update({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id,
                },
            },
            data: {
                status: "PLAN_TO_WATCH",
            },
        });

        // Optional: Remove the last 'WATCHED' activity to keep feed clean
        // We find the most recent WATCHED activity for this media
        const lastActivity = await prisma.activity.findFirst({
            where: {
                userId: session.user.id,
                mediaId: media.id,
                type: "WATCHED",
            },
            orderBy: { createdAt: "desc" },
        });

        if (lastActivity) {
            await prisma.activity.delete({
                where: { id: lastActivity.id },
            });
        }

        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true, isWatched: false };

    } else {
        // Toggle ON (Mark as WATCHED)
        await prisma.watchlistItem.upsert({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id,
                },
            },
            update: {
                status: "COMPLETED",
                addedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                mediaId: media.id,
                status: "COMPLETED",
            },
        });

        await prisma.activity.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
                type: "WATCHED",
                watchedAt: new Date(),
            },
        });

        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true, isWatched: true };
    }
}

export async function getWatchStatus(mediaId: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) return null;

    const item = await prisma.watchlistItem.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    return item?.status;
}

export async function addComment(mediaId: number, type: "movie" | "tv", content: string, title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: type === "movie" ? "MOVIE" : "TV",
                title: title,
                posterPath: posterPath,
            },
        });
    }

    const activity = await prisma.activity.create({
        data: {
            userId: session.user.id,
            mediaId: media.id,
            type: "REVIEWED",
            review: content,
        },
    });

    revalidatePath(`/${type}/${mediaId}`);
    return { success: true, activity };
}
