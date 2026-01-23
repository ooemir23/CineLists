"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleToWatch(mediaId: number, type: "movie" | "tv" | "person", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    // Verify user exists in DB
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!dbUser) {
        return { error: "Oturum geçersiz, lütfen tekrar giriş yapın." };
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

    // Check if already in toWatch
    const existing = await prisma.toWatch.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    if (existing) {
        await prisma.toWatch.delete({
            where: { id: existing.id },
        });
        revalidatePath("/watchlist");
        revalidatePath(`/movie/${mediaId}`);
        revalidatePath(`/tv/${mediaId}`);
        return { added: false };
    } else {
        // Remove from watched if it exists there (exclusive)
        const watched = await prisma.watched.findUnique({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id,
                },
            },
        });

        if (watched) {
            await prisma.watched.delete({
                where: { id: watched.id },
            });
        }

        await prisma.toWatch.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
            },
        });
        revalidatePath("/watchlist");
        revalidatePath(`/movie/${mediaId}`);
        revalidatePath(`/tv/${mediaId}`);
        return { added: true };
    }
}

export async function getToWatchStatus(mediaId: number) {
    const session = await auth();
    if (!session?.user?.id) return false;

    const media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) return false;

    const item = await prisma.toWatch.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    return !!item;
}


