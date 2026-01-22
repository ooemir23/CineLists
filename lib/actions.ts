"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleWatchlist(mediaId: number, type: "movie" | "tv" | "person", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    // Ensure media exists in our DB
    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: type === "movie" ? "MOVIE" : type === "tv" ? "TV" : "PERSON",
                title: title,
                posterPath: posterPath,
            },
        });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    if (existing) {
        await prisma.watchlistItem.delete({
            where: { id: existing.id },
        });
        revalidatePath("/watchlist");
        revalidatePath(`/movie/${mediaId}`);
        revalidatePath(`/tv/${mediaId}`);
        return { added: false };
    } else {
        await prisma.watchlistItem.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
                status: "PLAN_TO_WATCH",
            },
        });
        revalidatePath("/watchlist");
        revalidatePath(`/movie/${mediaId}`);
        revalidatePath(`/tv/${mediaId}`);
        return { added: true };
    }
}

export async function getWatchlistStatus(mediaId: number) {
    const session = await auth();
    if (!session?.user?.id) return false;

    const media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) return false;

    const item = await prisma.watchlistItem.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    return !!item;
}
