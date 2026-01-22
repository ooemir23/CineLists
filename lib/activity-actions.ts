"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markAsWatched(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    // Ensure media exists
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

    // Update or Create Watchlist Item status to COMPLETED
    await prisma.watchlistItem.upsert({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
        update: {
            status: "COMPLETED",
            addedAt: new Date(), // touch update time
        },
        create: {
            userId: session.user.id,
            mediaId: media.id,
            status: "COMPLETED",
        },
    });

    // Create Activity
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
    revalidatePath(`/movie/${mediaId}`); // revalidate details page
    revalidatePath(`/tv/${mediaId}`);

    return { success: true };
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
